import { Injectable } from '@nestjs/common';
import {
  Room as ProtooRoom,
  WebSocketServer as ProtooWebSocketServer,
} from '@/common/libs/protoo-server';
import env from '@/config/env';
import * as chalk from 'chalk';
import { CONSTANTS } from '@/common/enum';
import { MediaTransport } from '@/dao/transport/media.transport.do';
import { RoomService } from '../room/room.service';
import { RouterService } from '../router/router.service';
import { TransportService } from '../transport/transport.service';
import { ConsumerService } from '../consumer/consumer.service'; 
import { ProducerService } from '../producer/producer.service'; 
import { DataProducerService } from '../dataProducer/dataProducer.service';
import { DataConsumerService } from '../dataConsumer/dataConsumer.service';
import { PeerService } from '../peer/peer.service';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as url from 'url';
import { AwaitQueue } from 'awaitqueue';
import { v4 as uuidv4 } from 'uuid';
import { WebRtcTransportData } from '@/types';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class WebSocketService {
  
  /**
   * Async queue to manage rooms.
   * @type {AwaitQueue}
   */
  private queuePeer = new AwaitQueue();
  private queueCreateConsumer = new AwaitQueue();

  /**
   * Room id.
   * @type {String}
   */
  private _roomId: any;

  /**
   * protoo Room instance.
   * @type {ProtooRoom}
   */
  static _protooRoom: ProtooRoom;

  private _mediaRouter;

  constructor(
    @InjectPinoLogger(WebSocketService.name)
    private readonly logger: PinoLogger,
    private readonly roomService: RoomService,
    private readonly routerService: RouterService,
    private readonly transportService: TransportService,
    private readonly producerService: ProducerService,
    private readonly consumerService: ConsumerService,
    private readonly dataProducerService: DataProducerService,
    private readonly dataConsumerService: DataConsumerService,
    private readonly peerService: PeerService,
  ) { }

  /**
   * 初始化数据
   * @param roomId 房间 id
   */
  public initData(roomId: string): void {
    WebSocketService._protooRoom = this.roomService.getProtooRoom(roomId)
    this._roomId = roomId
  }

  /**
   * 创建ws连接
   */
  public runWSServer(appInstance: NestFastifyApplication) { 
    console.info(chalk.yellowBright(`App running at:
      - wss://${env.getEnv('SERVER_IP_MAIN')}:${env.getEnv('SERVER_PORT_MAIN')}/`));
    
    // 演示
    // this.logger.info({ foo: 'bar' }, 'baz %s', 'qux');

    const httpsServer = appInstance.getHttpServer()

    // Create the protoo WebSocket server.
    const protooWebSocketServer = new ProtooWebSocketServer(httpsServer, {
      maxReceivedFrameSize: env.getEnv('WS_MAX_RECEIVED_FRAME_SIZE'),
      maxReceivedMessageSize: env.getEnv('WS_MAX_RECEIVED_MESSAGE_SIZE'),
      fragmentationThreshold: env.getEnv('WS_FRAGMENTATION_THRESHOLD'),
      fragmentOutgoingMessages: env.getEnv('WS_FRAGMENT_OUTGOING_MESSAGES'),
    });

    // 触发连接时执行
    protooWebSocketServer.on(
      'connectionrequest',
      async (
        info,
        protooWebSocketTransportFun,
        reject, // connectionrequest这个是protoo.WebSocketServer的监听事件
      ) => {
        console.info(" -------------------------------------- ");
        console.info(" ------------- 新用户连接 ------------- ");
        console.info(" --------- connectionrequest --------- ");
        console.info(" -------------------------------------- ");

        // The client indicates the roomId and peerId in the URL query.
        const u = url.parse(info.request.url, true); // 解析ws的url
        const roomId: string = u.query['roomId'] || uuidv4();
        const peerId = <string>u.query['peerId'];
        if (!roomId || !peerId) {
          reject(400, 'Connection request without roomId and/or peerId');
          return
        }
        
        // 创建队列，将以下逻辑，统一放在一起执行；同时有其他人进入时，而不阻塞后者
        this.queuePeer.push(async () => {
          // 当 ws 连接时，自动创建房间，或者获取房间
          console.time(chalk.yellowBright(`用户:${peerId} this.roomService.createOrGetProducerRoom 房间耗时`))
          const room = await this.roomService.createOrGetProducerRoom({ roomId });
          console.timeEnd(chalk.yellowBright(`用户:${peerId} this.roomService.createOrGetProducerRoom 房间耗时`))
          let router
          if (room?.id) {
            // 创建 router
            console.time(chalk.yellowBright(`用户:${peerId} this.routerService.getOrCreate 路由耗时`))
            router = await this.routerService.getOrCreate({
              roomId: room.id
            })
            this._mediaRouter = router
            console.timeEnd(chalk.yellowBright(`用户:${peerId} this.routerService.getOrCreate 路由耗时`))
          }

          if (!router) {
            this.logger.error('没有相关router');
            return
          }

          this.initData(roomId)

          this.createProtooPeer({
            peerId,
            protooWebSocketTransportFun,
            serverType: room.serverType,
            routerId: router.routerId
          })
          
        }).catch((error) => {
          this.logger.error(error);
          reject(error);
        });
      }
    );
  }

  /**
   * 创建 peer，并注册 Protoo request 事件
   * 
   * @param {String} peerId - The id of the protoo peer to be created.
   * @param {Boolean} consume - Whether this peer wants to consume from others.
   * @param {protoo.WebSocketTransport} protooWebSocketTransportFun - The associated protoo WebSocket transport fun.
   */
  public async createProtooPeer({ peerId, protooWebSocketTransportFun, serverType, routerId }) {
    // 验证用户是否已经进入过
    const existingPeer = WebSocketService._protooRoom.getPeer(peerId);
    if (existingPeer) {
      console.warn('createProtooPeer() | 已存在相同peerId用户, closing it [peerId:%s]', peerId);
      existingPeer.close();
    }

    let peer;
    try {
      // 获取传输对象的
      // 返回 WebSocketTransport 对象（内置：WebSocketConnection实例），用于传递给 Peer 内使用
      const protooWebSocketTransport = protooWebSocketTransportFun();
      peer = WebSocketService._protooRoom.createPeer(peerId, protooWebSocketTransport, serverType);
    } catch (error) {
      this.logger.error(error)
    }

    // 使用 peer.data 缓存 mediasoup 相关的内容
    peer.data.joined = false;
    peer.data.displayName = undefined;
    peer.data.device = undefined;
    peer.data.rtpCapabilities = undefined;
    peer.data.sctpCapabilities = undefined;

    // 以下内容改成缓存数据表对象列表，然后再从数据库取出服务指向，从某服务取出并执行
    peer.data.transports = new Map();
    peer.data.producers = new Map();
    peer.data.consumers = new Map();
    peer.data.dataProducers = new Map();
    peer.data.dataConsumers = new Map();

    this.peerService.createPeer({
      peerId,
      routerId,
      roomId: this._roomId // 真实房间 id
    })
    
    // 监听 request 事件（接收 request 类型的消息）
    peer.on('request', (request, accept, reject) => {
      // console.info(chalk.blueBright(`ws 接收 "request" 消息 [method: ${request.method}, peerId: ${peer.id}]`));

      this._handleProtooRequest(peer, request, accept, reject).catch(
        (error) => {
          this.logger.error(error)
          reject(error);
        },
      );
    });

    // 监听某人退出房间事件
    peer.on('close', () => {
      console.debug('监听某人退出房间事件 protoo Peer "close" event [peerId: %s]', peer.id);

      // 检查退出房间的这个人，是否进入过房间
      if (peer.data.joined) {
        // 通知所有人某人退出房间
        for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
          otherPeer.notify('peerClosed', {
            peerId: peer.id
          }).catch((error) => { 
            this.logger.error(error)
          });
        }
      }

      // Iterate and close all mediasoup Transport associated to ·this Peer, so all
      // its Producers and Consumers will also be closed.
      // 将此人创建的所有 transport ，遍历关闭掉
      for (const transportId of peer.data.transports.keys()) {
        this.transportService.close({ transportId })
      }

      // 移除 consumer router
      // this.routerService.deleteRouter({ peerId })

      // 当最后一个人离开房间时才关闭房间
      if (WebSocketService._protooRoom.peers.length === 0) {
        console.info('last Peer in the room left, closing the room [roomId:%s]', this._roomId)
        this.close();
      }

    });
  }

  /**
   * Handle protoo requests from browsers.
   *
   * @async
   */
  public async _handleProtooRequest(peer, request, accept, reject) {    
    switch (request.method) {
      // 001
      // 获取路由的rtp能力
      case 'getRouterRtpCapabilities': {
        const mediasoupRouterCapabilities = await this.roomService.getCapabilities({
          roomId: this._roomId
        });
        accept(mediasoupRouterCapabilities)
        break;
      }
      // 002、003
      case 'createWebRtcTransport': {
        // NOTE: Don't require that the Peer is joined here, so the client can
        // initiate mediasoup Transports and be ready when he later joins.
        // 启动mediasoup传输，并准备好稍后加入。
        const { forceTcp, producing, consuming, sctpCapabilities } = request.data
        
        const data = {
          roomId: this._roomId,
          peerId: peer.id,
          webRtcTransportOptions: {
            enableSctp: Boolean(sctpCapabilities),
            numSctpStreams: (sctpCapabilities || {}).numStreams,
            appData: { producing, consuming },
          }
        }
        if (forceTcp) {
          Object.assign(data.webRtcTransportOptions, {
            enableUdp: false,
            enableTcp: true
          })
        }

        let mediasoupTransport: WebRtcTransportData
        try {
          // producer、consumer服务会分别创建 transport
          if (producing && !consuming) {
            mediasoupTransport = await this.transportService.createProducerTransport(data);
          } else if (!producing && consuming) {
            console.time(`用户${peer.id} 信令接口: createWebRtcTransport创建consumer createConsumerTransport耗时`)
            mediasoupTransport = await this.transportService.createConsumerTransport(data);
            console.timeEnd(`用户${peer.id} 信令接口: createWebRtcTransport创建consumer createConsumerTransport耗时`)
          } else {
            this.logger.error('请检查参数: producing、consuming')
            accept('请检查参数: producing、consuming')
          }
        } catch (error) {
          accept(error)
        }

        // 缓存 transport 的部分信息（transportData）
        peer.data.transports.set(mediasoupTransport.id, {
          mediasoupTransport,
          peerId: peer.id,
          appData: data.webRtcTransportOptions.appData
        })

        accept(mediasoupTransport)
        
        break;
      }
      // 004【先执行 002】
      case 'join': {
        // Ensure the Peer is not already joined.
        if (peer.data.joined) {
          this.logger.error('Peer already joined')
          return 
        }

        const { displayName, device, rtpCapabilities, sctpCapabilities } = request.data

        // Store client data into the protoo Peer data object.
        peer.data.joined = true
        peer.data.displayName = displayName
        peer.data.device = device
        peer.data.rtpCapabilities = rtpCapabilities
        peer.data.sctpCapabilities = sctpCapabilities

        // Tell the new Peer about already joined Peers.
        // And also create Consumers for existing Producers.

        const joinedPeers = [
          ...this._getJoinedPeers(),
          // TODO 【待处理】broadcaster 是 http 调用创建的，缓存在 peer.data 而已，需换址！
          // ...this._broadcasters.values()
        ]


        // 从 peers 列表中排除掉当前的 peer，并重新映射出一些所需的属性的数组，返回给客户端
        const peerInfos = joinedPeers
          .filter((joinedPeer) => joinedPeer.id !== peer.id)
          .map((joinedPeer) => ({
            id: joinedPeer.id,
            displayName: joinedPeer.data.displayName,
            device: joinedPeer.data.device,
          }))
        
        // 推送给客户端。除了请求者之外的其他人的 peers
        accept({ peers: peerInfos }) 

        // Mark the new Peer as joined.
        peer.data.joined = true


        // 向其他人发送有新人加入房间的通知
        // Notify the new Peer to all other Peers.
        const otherPeers = this._getJoinedPeers({ excludePeer: peer })
        for (const otherPeer of otherPeers) {
          otherPeer.notify('newPeer', {
            id: peer.id,
            displayName: peer.data.displayName,
            device: peer.data.device,
          }).catch((error) => {
            this.logger.error(error)
          })
        }
        
        // 遍历所有人
        // 创建 consumer
        for (const joinedPeer of joinedPeers) {
          // 从所有人中的 data.producers 中取出存在的 producer，并创建 consumer 消费
          for (const producer of joinedPeer.data.producers.values()) {
            // 所有现存的生产者，都创建对此新连接进来的人的消费渠道，
            // 效果：其他人可以看到新进来的人的画面
            this.queueCreateConsumer.push(async () => {
              await this._createConsumer({
                consumerPeer: peer, // 当前 peer 
                producerPeer: joinedPeer, // 他人的 peer
                producer, // 他人的 producer
              })
            })
            
          }
          
          // Create DataConsumers for existing DataProducers.
          for (const dataProducer of joinedPeer.data.dataProducers.values()) {
            if (dataProducer.label === 'bot') continue
            // 所有的现存的数据生产者，都创建对此新连接进来的人的数据消费渠道
            // 效果：其他人可以收到新进来的人的消息
            this._createDataConsumer({
              dataConsumerPeer: peer,
              dataProducerPeer: joinedPeer,
              dataProducer,
            })
          }
          
        }

        // Create DataConsumers for bot DataProducer.
        // this._createDataConsumer(
        //   //为机器人数据生产者创建对此新连接进来的人的数据消费渠道
        //   //效果：机器人可以收到新进来的人的消息
        //   {
        //     dataConsumerPeer: peer,
        //     dataProducerPeer: null,
        //     dataProducer: this._bot.dataProducer,
        //   }
        // )
        
        break;
      }
      // 005、006【先执行 002、003】
      case 'connectWebRtcTransport': {
        const { transportId, dtlsParameters } = request.data

        // 获取 transport
        const transport: MediaTransport = await this.transportService.get({ transportId });
        
        switch (transport.type) {
          case CONSTANTS.PRODUCER: {
            this.transportService.connectProducer({ transportId, dtlsParameters })
            break;
          }
          case CONSTANTS.CONSUMER: {
            this.transportService.connectConsumer({ transportId, dtlsParameters })
            break;
          }
          default: {
            accept('transport 类型有误')
          }
        }
       
        accept()

        break;
      }
      // 007【先执行 002，004】
      case 'produce': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) { 
          this.logger.error('Peer not yet joined')
          return
        }

        const { transportId, kind, rtpParameters } = request.data

        let { appData } = request.data

        const transport = peer.data.transports.get(transportId)

        if (!transport) {
          this.logger.error(`transport with id "${transportId}" not found`)
          return
        }

        // Add peerId into appData to later get the associated Peer during
        // the 'loudest' event of the audioLevelObserver.
        appData = { ...appData, peerId: peer.id }

        const producerData = await this.producerService.create({
          transportId,
          kind,
          rtpParameters,
          appData,
          peerId: peer.id
        })

        // Store the Producer into the protoo Peer data Object.
        peer.data.producers.set(producerData.id, producerData)

        accept({ id: producerData.id })

        
        /**
         * 在 join 时，通知了别人有新用户进入
         * 在这里创建出 producer 之后，遍历除自己以外的所有人，让其他人消费自己的 producer
         */
        for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
          this.queueCreateConsumer.push(async () => {
            await this._createConsumer({
              consumerPeer: otherPeer, // 他人 peer
              producerPeer: peer, // 当前 peer
              producer: producerData, // 当前 producer
            })

          })
        }

        // 【TODO】
        // Add into the audioLevelObserver.
        // if (producerData.kind === 'audio') {
        //   //如果是音频类型，在音频级别观察者中添加生产者，效果：当生产者发送音频时，其他Peer将收到音频级别事件？
        //   this._audioLevelObserver.addProducer({ producerId: producer.id }).catch(() => {})
        // }

        break;
      }
      // 008
      case 'produceData': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const { transportId, sctpStreamParameters, label, protocol, appData } = request.data

        const transport = peer.data.transports.get(transportId)
        if (!transport) {
          this.logger.error(`transport with id "${transportId}" not found`)
          return
        }
        
        let dataProducerData = await this.dataProducerService.createProduceData({
          transportId,
          label,
          protocol,
          sctpStreamParameters,
          appData,
        })

        // 将 dataProducerData 缓存到 peer.data.dataProducers 中
        peer.data.dataProducers.set(dataProducerData.id, dataProducerData)

        accept({ id: dataProducerData.id })

        switch (dataProducerData.label) {
          case 'chat': {
            // Create a server-side DataConsumer for each Peer.

            for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
              const params = {
                dataConsumerPeer: otherPeer,
                dataProducerPeer: peer,
                dataProducer: dataProducerData,
              }
              this._createDataConsumer(params)
            }
            break
          }

          // case 'bot': {
          //   // Pass it to the bot.
          //   this._bot.handlePeerDataProducer({
          //     dataProducerId: dataProducer.id,
          //     peer,
          //   })

          //   break
          // }
        }

        break;
      }
      // 009
      case 'restartIce': {
        const { transportId } = request.data

        let iceParameters

        // 获取 transport
        const transport: MediaTransport = await this.transportService.get({ transportId });
        
        switch (transport.type) {
          case CONSTANTS.PRODUCER: {
            iceParameters = await this.transportService.webRtcTransportRestartIceProducer({ transportId })
            break;
          }
          case CONSTANTS.CONSUMER: {
            iceParameters = await this.transportService.webRtcTransportRestartIceConsumer({ transportId })
            break;
          }
          default: {
            accept('transport 类型有误')
          }
        }

        accept(iceParameters)

        break;
      }
      // 010 关闭 摄像头 / 唛
      case 'closeProducer': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const { producerId } = request.data

        const producer = peer.data.producers.get(producerId)
        if (!producer) {
          this.logger.error(`producer with id "${producerId}" not found`)
          return
        }

        // 关闭生产者
        const res = await this.producerService.closeProducer({ producerId })
        // Remove from its map.
        peer.data.producers.delete(producer.id);

        // 通知 consumer 服务关闭consumer
        await this.consumerService.closeConsumer({ producerId })

        accept()
        break;
      }
      // 011
      case 'pauseProducer': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const { producerId } = request.data

        const producer = peer.data.producers.get(producerId)
        if (!producer) {
          this.logger.error(`producer with id "${producerId}" not found`)
          return
        }

        // 暂停生产者
        const res = await this.producerService.pause({ producerId })

        accept()

        break;
      }
      // 012
      case 'resumeProducer': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const { producerId } = request.data

        const producer = peer.data.producers.get(producerId)

        if (!producer) {
          this.logger.error(`producer with id "${producerId}" not found`)
          return
        }
        
        // 恢复生产者
        const res = await this.producerService.resume({ producerId })

        accept()

        break;
      }
      // 013
      case 'resumeConsumer': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const { consumerId } = request.data

        const consumer = peer.data.consumers.get(consumerId)
        if (!consumer) {
          this.logger.error(`consumer with id "${consumerId}" not found`)
          return
        }

        // 恢复消费者
        await this.consumerService.resume({ consumerId })

        accept()

        break;
      }
      // 014
      case 'pauseConsumer': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }
        
        const { consumerId } = request.data

        const consumer = peer.data.consumers.get(consumerId)
        if (!consumer) {
          this.logger.error(`consumer with id "${consumerId}" not found`)
          return
        }

        // 暂停生产者
        await this.consumerService.pause({ consumerId })

        accept()

        break;
      }
      // 015
      case 'setConsumerPreferredLayers': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }
        
        const { consumerId, spatialLayer, temporalLayer } = request.data

        const consumer = peer.data.consumers.get(consumerId)
        if (!consumer) {
          this.logger.error(`consumer with id "${consumerId}" not found`)
          return
        }
        
        // 设置消费首选图层
        const res = await this.consumerService.setPreferredLayers({
          consumerId,
          spatialLayer,
          temporalLayer
        })

        accept()

        break
      }
      // 016
      case 'setConsumerPriority': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const { consumerId, priority } = request.data

        const consumer = peer.data.consumers.get(consumerId)
        
        if (!consumer) {
          this.logger.error(`consumer with id "${consumerId}" not found`)
          return
        }
        
        // 设置消费优先级
        const res = await this.consumerService.setPriority({ consumerId, priority })

        accept()

        break
      }
      // 017、019
      case 'requestConsumerKeyFrame': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const { consumerId } = request.data

        const consumer = peer.data.consumers.get(consumerId)
        if (!consumer) {
          this.logger.error(`consumer with id "${consumerId}" not found`)
          return
        }

        // 请求消费关键帧
        const res = await this.consumerService.requestKeyFrame({ consumerId })

        accept()

        break
      }
      // 018
      case 'changeDisplayName': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const { displayName } = request.data
        const oldDisplayName = peer.data.displayName

        // Store the display name into the custom data Object of the protoo
        // Peer.
        peer.data.displayName = displayName

        // Notify other joined Peers.
        for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
          otherPeer
            .notify('peerDisplayNameChanged', {
              peerId: peer.id,
              displayName,
              oldDisplayName,
            })
            .catch(() => {})
        }

        accept()

        break
      }
      case 'getTransportStats': { 
        const { transportId } = request.data
        const transport = peer.data.transports.get(transportId)

        if (!transport) {
          this.logger.error(`transport with id "${transportId}" not found`)
          return;
        }

        const stats = await this.transportService.getStats({ transportId })
        // console.log("%c Line:817 🥝 getTransportStats stats", "color:#f5ce50", stats);

        accept(stats)

        break;
      }
      // 020
      case 'getProducerStats': {
        const { producerId } = request.data
        const producer = peer.data.producers.get(producerId)

        if (!producer) {
          this.logger.error(`producer with id "${producerId}" not found`)
          return
        }

        const stats = await this.producerService.getStats({ producerId })

        accept(stats)

        break
      }
      // 021
      case 'getConsumerStats': {
        const { consumerId } = request.data
        const consumer = peer.data.consumers.get(consumerId)
        if (!consumer) {
          this.logger.error(`consumer with id "${consumerId}" not found`)
          return
        }

        const stats = await this.consumerService.getStats({ consumerId })

        accept(stats)

        break
      }
      // 022
      case 'getDataProducerStats': {
        const { dataProducerId } = request.data
        const dataProducer = peer.data.dataProducers.get(dataProducerId)
        if (!dataProducer) {
          this.logger.error(`dataProducer with id "${dataProducerId}" not found`)
          return
        }

        const stats = await this.dataProducerService.getStats({ dataProducerId })

        accept(stats)

        break
      }
      // 023
      case 'getDataConsumerStats': {
        const { dataConsumerId } = request.data
        const dataConsumer = peer.data.dataConsumers.get(dataConsumerId)
        if (!dataConsumer) {
          this.logger.error(`dataConsumer with id "${dataConsumerId}" not found`)
          return
        }
        
        const stats = await this.dataConsumerService.getStats({ dataConsumerId })

        accept(stats)

        break
      }
      // 025
      case 'pauseConsumers': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const consumerIds = request.data.consumerIds // Assuming `consumerIds` is an array of consumer IDs

        for (const consumerId of consumerIds) {
          const consumer = peer.data.consumers.get(consumerId)
          if (!consumer) {
            this.logger.error(`consumer with id "${consumerId}" not found`)
            return
          }

          // 暂停生产者
          await this.consumerService.pause({ consumerId })
          
          accept()
        }
        break
      }
      // 026
      case 'resumeConsumers': {
        // Ensure the Peer is joined.
        if (!peer.data.joined) {
          this.logger.error('Peer not yet joined')
          return
        }

        const consumerIds = request.data.consumerIds // Assuming `consumerIds` is an array of consumer IDs

        for (const consumerId of consumerIds) {
          const consumer = peer.data.consumers.get(consumerId)
          if (!consumer) {
            this.logger.error(`consumer with id "${consumerId}" not found`)
            return
          }

          // 恢复消费者
          await this.consumerService.resume({ consumerId })
          
          accept()
        }
        break
      }
      case 'getResource': {
        const { roomId } = request.data

        // 根据 roomId 查询某个房间
        const room = await this.roomService.getRoom({ roomId });
        this.roomService.getResource({ roomId })
        this.routerService.getResource({ roomId: room.id })
        
        break;
      }
      default: {
        this.logger.error(`unknown request.method ${request.method}`);

        reject(500, `unknown request.method "${request.method}"`);
      }
    }
  }

  /**
   * 创建一个 mediasoup Consumer
   * Creates a mediasoup Consumer for the given mediasoup Producer.
   */
  async _createConsumer({ consumerPeer, producerPeer, producer }) {
    // Optimization:
    // - Create the server-side Consumer in paused mode.
    // - Tell its Peer about it and wait for its response.
    // - Upon receipt of the response, resume the server-side Consumer.
    // - If video, this will mean a single key frame requested by the
    //   server-side Consumer (when resuming it).
    // - If audio (or video), it will avoid that RTP packets are received by the
    //   remote endpoint *before* the Consumer is locally created in the endpoint
    //   (and before the local SDP O/A procedure ends). If that happens (RTP
    //   packets are received before the SDP O/A is done) the PeerConnection may
    //   fail to associate the RTP stream.
    // 优化:
    // - 在暂停模式下创建服务器端消费者
    // - 告诉它的Peer，并等待它的响应。
    // - 收到响应后，恢复服务器端消费者。
    // - 如果是视频，这将意味着一个关键帧请求服务器端消费者(当恢复时)。
    // - 如果是音频(或视频)，它将避免RTP数据包被接收
    // 远程端点*之前*消费者是在端点本地创建的
    // (并且在本地SDP O/A过程结束之前)。如果发生这种情况(RTP)
    // 在SDP O/A完成之前接收到数据包)PeerConnection可能
    // 关联RTP流失败。
    // NOTE: Don't create the Consumer if the remote Peer cannot consume it.


    // 从 peer.data.transports 缓存中，找到对应的 transportData
    const transportData: any = this._getConsumerTransport(consumerPeer);
    if (!transportData) {
      this.logger.error('_createConsumer() | Transport for consuming not found')
      return
    }

    let consumerData
    try {
      consumerData = await this.consumerService.createConsumer({
        transportId: transportData.mediasoupTransport.id,
        producerId: producer.id,
        rtpCapabilities: consumerPeer.data.rtpCapabilities,
        peerId: consumerPeer.id
      })

      // 将 consumer 服务返回的 consumerData 缓存到 peer.data.consumers
      if (consumerData) {
        consumerPeer.data.consumers.set(consumerData.id, consumerData)

        // Send a protoo request to the remote Peer with Consumer parameters.
        // 调用 peer.request() 发送一条 request 消息给客户端，通知客户端有新的 consumer
        const params: any = {
          peerId: producerPeer.id,
          producerId: producer.id,
          // 集群有该返回的内容
          id: consumerData.id,
          kind: consumerData.kind,
          rtpParameters: consumerData.rtpParameters,
          type: consumerData.type,
          producerPaused: consumerData.producerPaused,
        }
        params.appData = producer?.appData
        await consumerPeer.request('newConsumer', params)
  
        // Now that we got the positive response from the remote endpoint, resume
        // the Consumer so the remote endpoint will receive the a first RTP packet
        // of this new stream once its PeerConnection is already ready to process
        // and associate it.
        // 消费该 consumer
        await this.consumerService.resume({
          consumerId: consumerData.id
        })
  
        // 调用 consumer.resume() 方法之后，又要发送一条消息给客户端
        // consumerPeer.notify('consumerScore', {
        //   consumerId: consumerData.id,
        //   score: consumerData.score,
        // })

      }
    } catch (error) {
      this.logger.error(error)
      return void 0;
    }
  }

  /**
   * 创建一个 mediasoup DataConsumer
   * Creates a mediasoup DataConsumer for the given mediasoup DataProducer.
   */
  private async _createDataConsumer({
    dataConsumerPeer,
    dataProducerPeer = null, // This is null for the bot DataProducer.
    dataProducer,
  }) {

    // NOTE: Don't create the DataConsumer if the remote Peer cannot consume it.
    if (!dataConsumerPeer.data.sctpCapabilities) return

    // Must take the Transport the remote Peer is using for consuming.
    const transportData: any = this._getConsumerTransport(dataConsumerPeer);

    // This should not happen.
    if (!transportData) {
      this.logger.warn('_createDataConsumer() | Transport for consuming not found')
      return
    }

    // 创建 DataConsumer Data 数据对象
    let dataConsumerData

    try {
      dataConsumerData = await this.dataConsumerService.createConsumeData({
        transportId: transportData.mediasoupTransport.id,
        dataProducerId: dataProducer.id,
        peerId: dataConsumerPeer.id,
      })
    } catch (error) {
      this.logger.warn(' 🍷 _createDataConsumer() | transport.consumeData():%o', error)
      return
    }

    // Store the DataConsumer into the protoo dataConsumerPeer data Object.
    dataConsumerPeer.data.dataConsumers.set(dataConsumerData.id, dataConsumerData)


    // 调用 peer.request() 发送一条 request 消息给客户端，通知客户端有新的 dataConsumer
    // Send a protoo request to the remote Peer with Consumer parameters.
    try {
      const params: any = {
        // This is null for bot DataProducer.
        peerId: dataProducerPeer ? dataProducerPeer.id : null,
        dataProducerId: dataProducer.id,
        appData: dataProducer.appData,
        id: dataConsumerData.id,
        sctpStreamParameters: dataConsumerData.sctpStreamParameters,
        label: dataConsumerData.label,
        protocol: dataConsumerData.protocol
      }
      // params.appData = dataProducer.appData
      await dataConsumerPeer.request('newDataConsumer', params);
      
      // 再恢复 dataConsumer
      await this.dataConsumerService.resume({
        dataConsumerId: dataConsumerData.id
      })

    } catch (error) {
      this.logger.warn('_createDataConsumer() | failed:%o', error)
    }
  }

  /**
   * 获取 _protooRoom.peers 中那些 peer 是存在 joined
   * 如果有入参，就排除该 peer 在外
   * @param { { excludePeer: Peer } } 被排除的 peer
   * @returns JoinedPeers
   */
  _getJoinedPeers({ excludePeer = { id: ''} } = {}) {
    return WebSocketService._protooRoom.peers.filter((peer) => {
      return peer.data.joined && peer.id !== excludePeer.id
    })
  }

  /**
   * 从 peer.data.transports 缓存中，找到对应的 transportData
   * @param peer 
   * @returns 
   */
  private _getConsumerTransport(peer) {
    if (peer?.data?.transports) {
      const transportData: any = Array.from(peer.data.transports.values()).find((t: any) => t.appData.consuming);
      return transportData;
    }
    return;
  }
  
  /**
   * 关闭房间
   * 
   * Closes the Room instance by closing the protoo Room and the mediasoup Router.
   */
  public close() {

    // Close the protoo Room.
    WebSocketService._protooRoom.close();

    // Close the mediasoup Router.
    this.roomService.close({
      roomId: this._roomId
    })

    // // Close the Bot.
    // this._bot.close()

    // // Stop network throttling.
    // if (this._networkThrottled) {
    //   throttle.stop({}).catch(() => {})
    // }
  }

  /********************* 新内容 *********************/
  /**
   * 事件监听回推 notify 消息
   * 注：无需遍历，无需区分method
   */
  public async notifyMain(data) {
    try {
      const { method, params, peerId } = data;
      const peer = WebSocketService._protooRoom?.getPeer(peerId);
      if (!peer) return;
      
      // 发送通知
      await peer?.notify(method, params);

      // 删除缓存
      switch (method) { 
        case 'consumerClosed':
          peer?.data.consumers.delete(params.consumerId)
          break;
        case 'dataConsumerClosed':
          peer?.data.dataConsumers.delete(params.dataConsumerId)
          break;
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  /**
   * 操作 peer.data.consumers 合集
   */
  public async peerConsumerHandle(data) {
    const { method, params, peerId } = data;
    const peer = WebSocketService._protooRoom?.getPeer(peerId);
    if (!peer) return;

    switch (method) {
      case 'transportclose':
        peer?.data.consumers.delete(params.consumerId)
        break;
    }
  }

  /**
   * 操作 peer.data.dataConsumers 合集
   */
  public async peerDataConsumerHandle(data) {
    const { type, params, peerId } = data;
    const peer = WebSocketService._protooRoom?.getPeer(peerId);
    if (!peer) return;
    
    switch (type) {
      case 'transportclose':
      case 'dataproducerclose':
        peer?.data.dataConsumers.delete(params.dataConsumerId)
        break;
    }
  }

  get roomId() {
    return this._roomId
  }

  get mediaRouter() {
    return this._mediaRouter;
  }
}
