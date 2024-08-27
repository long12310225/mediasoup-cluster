const protoo = require('../lib/protoo-server/lib')
const url = require('url')
const { AwaitQueue } = require('awaitqueue');
const Room = require('../lib/Room')
const Logger = require('../lib/Logger')
const logger = new Logger()

// Async queue to manage rooms.
// @type {AwaitQueue}
const queue = new AwaitQueue();

// Index of next mediasoup Worker to use.
// @type {Number}
let nextMediasoupWorkerIdx = 0

module.exports = {
  /**
   * Create a protoo WebSocketServer to allow WebSocket connections from browsers.
   */
  runProtooWebSocketServer: async ({ httpsServer, rooms, mediasoupWorkers }) => {
    logger.info('running protoo WebSocketServer...')

    // Create the protoo WebSocket server.
    const protooWebSocketServer = new protoo.WebSocketServer(httpsServer, {
      maxReceivedFrameSize: 960000, // 960 KBytes.
      maxReceivedMessageSize: 960000,
      fragmentOutgoingMessages: true,
      fragmentationThreshold: 960000,
    })

    // Handle connections from clients.
    protooWebSocketServer.on(
      'connectionrequest',
      (
        info,
        accept,
        reject //connectionrequest这个是protoo.WebSocketServer的监听事件
      ) => {
        // The client indicates the roomId and peerId in the URL query.
        const u = url.parse(info.request.url, true) //解析ws的url
        const roomId = u.query['roomId']
        const peerId = u.query['peerId']

        if (!roomId || !peerId) {
          reject(400, 'Connection request without roomId and/or peerId')

          return
        }

        logger.info(
          'protoo connection request [roomId:%s, peerId:%s, address:%s, origin:%s]',
          roomId,
          peerId,
          info.socket.remoteAddress,
          info.origin
        )

        // Serialize this code into the queue to avoid that two peers connecting at
        // the same time with the same roomId create two separate rooms with same
        // roomId.
        queue
          .push(async () =>
            //往任务队列放一个异步任务
          {
              // 获取或创建房间（保留在主信令服务，作为一个虚拟房间，用于在信令服务收集该房间的信息用）
              // 也就是说在从生产服务，也有一个相同参数的room，只是从生产服务的才是进行逻辑处理的room，主信令服务的room只是用于收集客户端wss的请求的
              const room = await getOrCreateRoom({ rooms, roomId, mediasoupWorkers })

              // Accept the protoo WebSocket connection.
              const protooWebSocketTransport = accept() //接受此wss连接

              room.handleProtooConnection({ peerId, protooWebSocketTransport }) // 调用Room.js的接口处理protoo连接
            }
          )
          .catch((error) => {
            logger.error('room creation or room joining failed:%o', error)

            reject(error)
          })
      }
    )
  },
}

/**
 * Get next mediasoup Worker.
 */
function getMediasoupWorker(mediasoupWorkers) {
  const worker = mediasoupWorkers[nextMediasoupWorkerIdx]

  if (++nextMediasoupWorkerIdx === mediasoupWorkers.length) nextMediasoupWorkerIdx = 0

  return worker
}

/**
 * Get a Room instance (or create one if it does not exist).
 */
async function getOrCreateRoom({ rooms, roomId, mediasoupWorkers }) {
  let room = rooms.get(roomId)

  // If the Room does not exist create a new one.
  if (!room) {
    logger.info('creating a new Room [roomId:%s]', roomId)

    const mediasoupWorker = getMediasoupWorker(mediasoupWorkers)

    room = await Room.create({ mediasoupWorker, roomId })

    rooms.set(roomId, room)
    room.on('close', () => rooms.delete(roomId))
  }

  return room
}
