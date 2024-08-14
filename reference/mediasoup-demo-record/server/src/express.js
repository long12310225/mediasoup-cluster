const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const https = require('https')
const config = require('../config')
const Logger = require('../lib/Logger')
const logger = new Logger()

module.exports = {
  /**
   * Create an Express based API server to manage Broadcaster requests.
   * 创建express实例，用于处理广播拉流推流的接口
   */
  createExpressApp: async function (rooms) {
    // 创建express实例
    const expressApp = express()

    // 使用express的bodyParser中间件，用于解析请求体中的JSON数据
    expressApp.use(bodyParser.json())

    /**
     * For every API request, verify that the roomId in the path matches and existing room.
     * 定义了一个express中间件，专门处理URL路径中的roomId参数，在后续请求之前，会先检验此roomId是否合法
     */
    expressApp.param('roomId', (req, res, next, roomId) => {
      // The room must exist for all API requests.
      // 从全局的 rooms 中取出 roomId 校验
      if (!rooms.has(roomId)) {
        const error = new Error(`room with id "${roomId}" not found`)

        error.status = 404
        throw error
      }

      req.room = rooms.get(roomId)

      next()
    })

    /***************************************************
     ******************* api 接口部分 *******************
     ***************************************************/

    /**
     * API 接口：/rooms/:roomId
     * 获取房间的RTP能力
     *
     * API GET resource that returns the mediasoup Router RTP capabilities of the room.
     */
    expressApp.get('/rooms/:roomId', (req, res) => {
      const data = req.room.getRouterRtpCapabilities()

      res.status(200).json(data)
    })

    /**
     * API 接口：/rooms/:roomId/broadcasters
     * 创建广播者
     *
     * POST API to create a Broadcaster.
     */
    expressApp.post('/rooms/:roomId/broadcasters', async (req, res, next) => {
      const { id, displayName, device, rtpCapabilities } = req.body

      try {
        // 调用Room.js的接口创建广播者
        const data = await req.room.createBroadcaster({
          id,
          displayName,
          device,
          rtpCapabilities,
        })

        res.status(200).json(data)
      } catch (error) {
        next(error)
      }
    })

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId
     * 删除一个广播者
     *
     * DELETE API to delete a Broadcaster.
     */
    expressApp.delete('/rooms/:roomId/broadcasters/:broadcasterId', (req, res) => {
      const { broadcasterId } = req.params

      // 调用Room.js的接口删除广播者
      req.room.deleteBroadcaster({ broadcasterId })

      res.status(200).send('broadcaster deleted')
    })

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId/transports
     * 创建广播传输通道
     *
     * POST API to create a mediasoup Transport associated to a Broadcaster.
     * It can be a PlainTransport or a WebRtcTransport depending on the type parameters in the body.
     * There are also additional parameters for PlainTransport.
     */
    expressApp.post('/rooms/:roomId/broadcasters/:broadcasterId/transports', async (req, res, next) => {
      const { broadcasterId } = req.params
      const { type, rtcpMux, comedia, sctpCapabilities } = req.body

      try {
        // 调用Room.js的接口创建广播传输通道
        const data = await req.room.createBroadcasterTransport({
          broadcasterId,
          type,
          rtcpMux,
          comedia,
          sctpCapabilities,
        })

        res.status(200).json(data)
      } catch (error) {
        next(error)
      }
    })

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect
     * 连接传输通道
     *
     * POST API to connect a Transport belonging to a Broadcaster.
     * Not needed for PlainTransport if it was created with comedia option set to true.
     */
    expressApp.post(
      '/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect',
      async (req, res, next) => {
        const { broadcasterId, transportId } = req.params
        const { dtlsParameters } = req.body

        try {
          // 调用Room.js的接口连接传输通道
          const data = await req.room.connectBroadcasterTransport({
            broadcasterId,
            transportId,
            dtlsParameters,
          })

          res.status(200).json(data)
        } catch (error) {
          next(error)
        }
      }
    )

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/plainconnect
     * 连接plain传输通道
     *
     * POST API to connect a Transport belonging to a Broadcaster.
     * for PlainTransport
     */
    expressApp.post(
      '/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/plainconnect',
      async (req, res, next) => {
        const { broadcasterId, transportId } = req.params
        const { ip, port, rtcpport } = req.body
        logger.info('rtcpport %d', rtcpport)

        try {
          // 调用Room.js的接口连接plain传输通道
          const data = await req.room.connectBroadcasterPlainTransport({
            broadcasterId,
            transportId,
            ip,
            port,
            rtcpport,
          })

          res.status(200).json(data)
        } catch (error) {
          next(error)
        }
      }
    )

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers
     * 创建广播生产者
     *
     * POST API to create a mediasoup Producer associated to a Broadcaster.
     * The exact Transport in which the Producer must be created is signaled in
     * the URL path. Body parameters include kind and rtpParameters of the
     * Producer.
     */
    expressApp.post(
      '/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers',
      async (req, res, next) => {
        const { broadcasterId, transportId } = req.params
        const { kind, rtpParameters } = req.body

        try {
          // 调用Room.js的接口创建广播生产者
          const data = await req.room.createBroadcasterProducer({
            broadcasterId,
            transportId,
            kind,
            rtpParameters,
          })

          res.status(200).json(data)
        } catch (error) {
          next(error)
        }
      }
    )

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume
     * 创建广播消费者
     *
     * POST API to create a mediasoup Consumer associated to a Broadcaster.
     * The exact Transport in which the Consumer must be created is signaled in
     * the URL path. Query parameters must include the desired producerId to consume.
     */
    expressApp.post(
      '/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume',
      async (req, res, next) => {
        const { broadcasterId, transportId } = req.params
        const { producerId } = req.query

        try {
          // 调用Room.js的接口创建广播消费者
          const data = await req.room.createBroadcasterConsumer({
            broadcasterId,
            transportId,
            producerId,
          })

          res.status(200).json(data)
        } catch (error) {
          next(error)
        }
      }
    )

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId/consume/:consumeId/resume
     * 恢复消费者
     *
     * POST API to consume.resume
     */
    expressApp.post('/rooms/:roomId/broadcasters/:broadcasterId/consume/:consumeId/resume', async (req, res, next) => {
      const { broadcasterId, consumeId } = req.params
      logger.info('******in resume, consumeId:%s', String(consumeId))
      try {
        // 调用Room.js的接口恢复消费者
        const data = await req.room.consumerRsume({
          broadcasterId,
          consumeId,
        })
        res.status(200).json(data)
      } catch (error) {
        next(error)
      }
    })

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume/data
     * 创建广播数据消费者
     *
     * POST API to create a mediasoup DataConsumer associated to a Broadcaster.
     * The exact Transport in which the DataConsumer must be created is signaled in
     * the URL path. Query body must include the desired producerId to consume.
     */
    expressApp.post(
      '/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume/data',
      async (req, res, next) => {
        const { broadcasterId, transportId } = req.params
        const { dataProducerId } = req.body

        try {
          // 调用Room.js的接口创建广播数据消费者
          const data = await req.room.createBroadcasterDataConsumer({
            broadcasterId,
            transportId,
            dataProducerId,
          })

          res.status(200).json(data)
        } catch (error) {
          next(error)
        }
      }
    )

    /**
     * API 接口：/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/produce/data
     * 创建广播数据生产者
     *
     * POST API to create a mediasoup DataProducer associated to a Broadcaster.
     * The exact Transport in which the DataProducer must be created is signaled in
     */
    expressApp.post(
      '/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/produce/data',
      async (req, res, next) => {
        const { broadcasterId, transportId } = req.params
        const { label, protocol, sctpStreamParameters, appData } = req.body

        try {
          // 调用Room.js的接口创建广播数据生产者
          const data = await req.room.createBroadcasterDataProducer({
            broadcasterId,
            transportId,
            label,
            protocol,
            sctpStreamParameters,
            appData,
          })

          res.status(200).json(data)
        } catch (error) {
          next(error)
        }
      }
    )

    /**
     * Error handler.
     */
    expressApp.use((error, req, res, next) => {
      if (error) {
        logger.warn('Express app %s', String(error))

        error.status = error.status || (error.name === 'TypeError' ? 400 : 500)

        res.statusMessage = error.message
        res.status(error.status).send(String(error))
      } else {
        next()
      }
    })

    return runHttpsServer(expressApp)
  },
}

/**
 * 创建http服务
 * 
 * Create a Node.js HTTPS server. It listens in the IP and port given in the
 * configuration file and reuses the Express application as request listener.
 */
async function runHttpsServer(expressApp) {
  logger.info('running an HTTPS server...')

  const tls = {
    cert: fs.readFileSync(config.https.tls.cert),
    key: fs.readFileSync(config.https.tls.key),
  }

  const httpsServer = https.createServer(tls, expressApp)

  await new Promise((resolve) => {
    httpsServer.listen(Number(config.https.listenPort), config.https.listenIp, resolve)
  })

  return httpsServer
}
