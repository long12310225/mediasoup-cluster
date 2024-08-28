import { Injectable } from "@nestjs/common";
import { BroadcasterDto, BroadcasterTransportDto, ConnectBroadcasterTransportDto } from "@/dto";
import env from '@/config/env';
import { WebSocketService } from "../websocket/websocket.service";
import { TransportService } from "../transport/transport.service";
import { ProducerService } from "../producer/producer.service";
import { ConsumerService } from "../consumer/consumer.service";
import { DataConsumerService } from "../dataConsumer/dataConsumer.service";
import { DataProducerService } from "../dataProducer/dataProducer.service";
import { WebRtcTransportData } from '@/types';
import { constants } from '@/common/constants';

@Injectable()
export class BroadcasterService {
  // Map of broadcasters indexed by id. Each Object has:
  // - {String} id
  // - {Object} data
  //   - {String} displayName
  //   - {Object} device
  //   - {RTCRtpCapabilities} rtpCapabilities
  //   - {Map<String, mediasoup.Transport>} transports
  //   - {Map<String, mediasoup.Producer>} producers
  //   - {Map<String, mediasoup.Consumers>} consumers
  //   - {Map<String, mediasoup.DataProducer>} dataProducers
  //   - {Map<String, mediasoup.DataConsumers>} dataConsumers
  private static _broadcasters = new Map()

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly transportService: TransportService,
    private readonly producerService: ProducerService,
    private readonly consumerService: ConsumerService,
    private readonly dataConsumerService: DataConsumerService,
    private readonly dataProducerService: DataProducerService,
  ) {}

  /**
   * 创建广播者
   * @param { BroadcasterDto } data 
   * @returns 
   */
  public async createBroadcaster({ id, displayName, device, rtpCapabilities }: BroadcasterDto) {
    if (typeof id !== 'string' || !id) throw new TypeError('missing body.id')
      else if (typeof displayName !== 'string' || !displayName) throw new TypeError('missing body.displayName')
      else if (typeof device.name !== 'string' || !device.name) throw new TypeError('missing body.device.name')
      else if (rtpCapabilities && typeof rtpCapabilities !== 'object') throw new TypeError('wrong body.rtpCapabilities')
  
      if (BroadcasterService._broadcasters.has(id)) throw new Error(`broadcaster with id "${id}" already exists`)
  
      const broadcaster = {
        id,
        data: {
          displayName,
          device: {
            flag: 'broadcaster',
            name: device.name || 'Unknown device',
            version: device.version,
          },
          rtpCapabilities,
          transports: new Map(),
          producers: new Map(),
          consumers: new Map(),
          dataProducers: new Map(),
          dataConsumers: new Map(),
        },
      }
  
      // Store the Broadcaster into the map.
      BroadcasterService._broadcasters.set(broadcaster.id, broadcaster)
  
      // Notify the new Broadcaster to all Peers.
      for (const otherPeer of this.webSocketService._getJoinedPeers()) {
        otherPeer.notify('newPeer', {
          id: broadcaster.id,
          displayName: broadcaster.data.displayName,
          device: broadcaster.data.device,
        }).catch((e) => {
          console.error(e)
        })
      }
  
      // Reply with the list of Peers and their Producers.
      const peerInfos = []
      const joinedPeers = this.webSocketService._getJoinedPeers()
  
      // Just fill the list of Peers if the Broadcaster provided its rtpCapabilities.
      if (rtpCapabilities) {
        for (const joinedPeer of joinedPeers) {
          const peerInfo = {
            id: joinedPeer.id,
            displayName: joinedPeer.data.displayName,
            device: joinedPeer.data.device,
            producers: [],
          }
  
          for (const producer of joinedPeer.data.producers.values()) {
            peerInfo.producers.push({
              id: producer.id,
              kind: producer.kind,
            })
          }
  
          peerInfos.push(peerInfo)
        }
      }
  
    return { peers: peerInfos }
    
  }

  /**
   * 删除广播者
   * @param data
   */
  public async deleteBroadcaster({ broadcasterId }) {
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)

    if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`)

    for (const transport of broadcaster.data.transports.values()) {
      // transport.close()
      this.transportService.close({
        transportId: transport.id
      })
    }

    BroadcasterService._broadcasters.delete(broadcasterId)

    for (const peer of this.webSocketService._getJoinedPeers()) {
      peer.notify('peerClosed', {
        peerId: broadcasterId
      }).catch((e) => { 
        console.error(e)
      })
    }

    return 'broadcaster deleted';
  }

  /**
   * Create a mediasoup Transport associated to a Broadcaster. It can be a PlainTransport or a WebRtcTransport.
   *
   * @type {String} broadcasterId
   * @type {String} type - Can be 'plain' (PlainTransport) or 'webrtc' (WebRtcTransport).
   * @type {Boolean} [rtcpMux=false] - Just for PlainTransport, use RTCP mux.
   * @type {Boolean} [comedia=true] - Just for PlainTransport, enable remote IP:port autodetection.
   * @type {Object} [sctpCapabilities] - SCTP capabilities
   */
  public async createBroadcasterTransport({
    broadcasterId,
    type,
    rtcpMux = false,
    comedia = true,
    sctpCapabilities
  }: BroadcasterTransportDto) {
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)
    if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`)

    switch (type) {
      case 'webrtc': {
        const data = {
          roomId: this.webSocketService.roomId,
          webRtcTransportOptions: {
            enableSctp: Boolean(sctpCapabilities),
            numSctpStreams: (sctpCapabilities || {}).numStreams,
          }
        }
        let mediasoupTransport: WebRtcTransportData = await this.transportService.createProducerTransport(data);
        broadcaster.data.transports.set(mediasoupTransport.id, mediasoupTransport);

        return mediasoupTransport;
      }

      case 'plain': {
        const data = {
          roomId: this.webSocketService.roomId,
          plainTransportOptions: {
            rtcpMux: rtcpMux,
            comedia: comedia,
          }
        }

        // 存有一份在 数据库 和 从服务的内存中
        const transport = await this.transportService.createPlainTransport(data)
        // 缓存到信令服务内存中
        broadcaster.data.transports.set(transport.id, transport)
        console.log("%c Line:198 🍤 3 创建transport -- broadcaster.data.transports", "color:#2eafb0", broadcaster.data.transports);

        return transport
      }

      default: {
        return 'type 类型错误'
      }
    }
  }

  /**
   * Connect a Broadcaster mediasoup WebRtcTransport.
   *
   * @async
   *
   * @type {String} broadcasterId
   * @type {String} transportId
   * @type {RTCDtlsParameters} dtlsParameters - Remote DTLS parameters.
   */
  public async connectBroadcasterTransport({
    broadcasterId,
    transportId,
    dtlsParameters
  }: ConnectBroadcasterTransportDto) {
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)
    if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`)

    const transportData = broadcaster.data.transports.get(transportId)
    if (!transportData) throw new Error(`transport with id "${transportId}" does not exist`)

    if (transportData.constructor.name !== 'WebRtcTransport') {
      throw new Error(`transport with id "${transportId}" is not a WebRtcTransport`)
    }
    // await transport.connect({ dtlsParameters })

    // 获取 transport
    const transport = await this.transportService.get({ transportId });
        
    switch (transport.type) {
      case constants.PRODUCER: {
        this.transportService.connectProducer({ transportId, dtlsParameters })
        break;
      }
    }

  }

  /**
   * Connect a Broadcaster mediasoup PlanTransport.
   */
  async connectBroadcasterPlainTransport({
    broadcasterId,
    transportId,
    ip,
    port,
    rtcpport
  }) {
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)
    if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`)

    const transport = broadcaster.data.transports.get(transportId)
    if (!transport) throw new Error(`transport with id "${transportId}" does not exist`)
    
    // await transport.connect({
    //   ip,
    //   port,
    //   rtcpPort
    // })

    await this.transportService.connectPlainTransport({
      transportId,
      ip,
      port,
      rtcpport
    })

    return { id: transportId }
  }

  /**
   * Create a mediasoup Producer associated to a Broadcaster.
   *
   * @async
   *
   * @type {String} broadcasterId
   * @type {String} transportId
   * @type {String} kind - 'audio' or 'video' kind for the Producer.
   * @type {RTCRtpParameters} rtpParameters - RTP parameters for the Producer.
   */
  async createBroadcasterProducer({ broadcasterId, transportId, kind, rtpParameters }) {
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)
    if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`)

    const transport = broadcaster.data.transports.get(transportId)
    if (!transport) throw new Error(`transport with id "${transportId}" does not exist`)
    
    // const producer = await transport.produce({ kind, rtpParameters })
    const producer = await this.producerService.create({
      transportId,
      kind,
      rtpParameters
    })

    // Store it.
    broadcaster.data.producers.set(producer.id, producer)

    // Optimization: Create a server-side Consumer for each Peer.
    for (const peer of this.webSocketService._getJoinedPeers()) {
      this.webSocketService._createConsumer({
        consumerPeer: peer,
        producerPeer: broadcaster,
        producer,
      })
    }

    // Add into the audioLevelObserver.
    // if (producer.kind === 'audio') {
    //   this._audioLevelObserver.addProducer({ producerId: producer.id }).catch(() => {})
    // }

    return { id: producer.id }
  }

  /**
   * Create a mediasoup Consumer associated to a Broadcaster.
   *
   * @async
   *
   * @type {String} broadcasterId
   * @type {String} transportId
   * @type {String} producerId
   */
  async createBroadcasterConsumer({ broadcasterId, transportId, producerId }) {
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)
    if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`)
    if (!broadcaster.data.rtpCapabilities) throw new Error('broadcaster does not have rtpCapabilities')

    const transportData = broadcaster.data.transports.get(transportId)
    if (!transportData) throw new Error(`transport with id "${transportId}" does not exist`)
    
    // const consumer = await transport.consume({
    //   producerId,
    //   rtpCapabilities: broadcaster.data.rtpCapabilities,
    //   paused: true,
    // })

    let consumer = await this.consumerService.createBroadcasterConsumer({
      transportId: transportData.id,
      producerId,
      rtpCapabilities: broadcaster.data.rtpCapabilities,
      broadcasterId
    })

    // Store it.
    broadcaster.data.consumers.set(consumer.id, consumer)
    console.log("%c Line:373 🥥 5 创建 consumer -- createBroadcasterConsumer broadcaster.data.consumers", "color:#f5ce50", broadcaster.data.consumers);

    // // Set Consumer events.
    // consumer.on('transportclose', () => {
    //   // Remove from its map.
    //   broadcaster.data.consumers.delete(consumer.id)
    // })

    // consumer.on('producerclose', () => {
    //   // Remove from its map.
    //   broadcaster.data.consumers.delete(consumer.id)
    // })

    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
    }
  }

  /**
   * 对 createBroadcasterConsumer 方法的集群事件传递处理
   * @param data 
   */
  public async broadcastConsumerHandle(data) {
    const { method, params, broadcasterId } = data;
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)

    switch (method) {
      case 'transportclose':
      case 'producerclose':
        broadcaster?.data.dataConsumers.delete(params.consumerId)
        break;
    }
  }

  /**
   * mediasoup Consumer resume.
   *
   * @async
   *
   * @type {String} broadcasterId
   * @type {String} producerId
   */
  async consumerResume(data: {
    broadcasterId: string;
    consumeId: string;
  }) {
    console.log("%c Line:373 🌰 6 消费 consumer -- consumerResume data", "color:#f5ce50", data);
      
    const broadcaster = BroadcasterService._broadcasters.get(data. broadcasterId)
    if (!broadcaster) throw new Error(`broadcaster with id "${data.broadcasterId}" does not exist`)
    if (!broadcaster.data.rtpCapabilities) throw new Error('broadcaster does not have rtpCapabilities')

    // get consumer.
    const consumer = broadcaster.data.consumers.get(data.consumeId)
    console.log("%c Line:373 🌰 6 消费 consumer -- consumerResume consumer", "color:#f5ce50", consumer);
     
    setTimeout(async () => {
      // await consumer.resume()

      // 消费该 consumer
      await this.consumerService.broadcasterConsumerResume({
        consumerId: consumer.id
      })
    }, 1000)

    return {
      id: data.consumeId,
    }
  }

  /**
   * Create a mediasoup DataConsumer associated to a Broadcaster.
   *
   * @async
   *
   * @type {String} broadcasterId
   * @type {String} transportId
   * @type {String} dataProducerId
   */
  async createBroadcasterDataConsumer({ broadcasterId, transportId, dataProducerId }) {
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)
    if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`)
    if (!broadcaster.data.rtpCapabilities) throw new Error('broadcaster does not have rtpCapabilities')

    const transportData = broadcaster.data.transports.get(transportId)
    if (!transportData) throw new Error(`transport with id "${transportId}" does not exist`)

    // const dataConsumer = await transport.consumeData({
    //   dataProducerId,
    // })

    const dataConsumer = await this.dataConsumerService.createConsumeData({
      transportId: transportData.id,
      dataProducerId,
      broadcasterId
    })

    // Store it.
    broadcaster.data.dataConsumers.set(dataConsumer.id, dataConsumer)

    // // Set Consumer events.
    // dataConsumer.on('transportclose', () => {
    //   // Remove from its map.
    //   broadcaster.data.dataConsumers.delete(dataConsumer.id)
    // })

    // dataConsumer.on('dataproducerclose', () => {
    //   // Remove from its map.
    //   broadcaster.data.dataConsumers.delete(dataConsumer.id)
    // })

    return {
      id: dataConsumer.id,
    }
  }

  /**
   * 对 createBroadcasterDataConsumer 方法的集群事件传递处理
   * @param data 
   */
  public async broadcastDataConsumerHandle(data) {
    const { method, params, broadcasterId } = data;
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)

    switch (method) {
      case 'transportclose':
      case 'producerclose':
        broadcaster?.data.dataConsumers.delete(params.dataConsumerId)
        break;
    }
  }

  /**
   * Create a mediasoup DataProducer associated to a Broadcaster.
   *
   * @async
   *
   * @type {String} broadcasterId
   * @type {String} transportId
   */
  async createBroadcasterDataProducer({ broadcasterId, transportId, label, protocol, sctpStreamParameters, appData }) {
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)
    if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`)

    const transport = broadcaster.data.transports.get(transportId)
    if (!transport) throw new Error(`transport with id "${transportId}" does not exist`)

    // const dataProducer = await transport.produceData({
    //   sctpStreamParameters,
    //   label,
    //   protocol,
    //   appData,
    // })

    let dataProducer = await this.dataProducerService.createProduceData({
      transportId,
      label,
      protocol,
      sctpStreamParameters,
      appData,
      broadcasterId
    })

    // Store it.
    broadcaster.data.dataProducers.set(dataProducer.id, dataProducer)

    // // Set Consumer events.
    // dataProducer.on('transportclose', () => {
    //   // Remove from its map.
    //   broadcaster.data.dataProducers.delete(dataProducer.id)
    // })

    return {
      id: dataProducer.id,
    }
  }

  /**
   * 对 createBroadcasterDataProducer 方法的集群事件传递处理
   * @param data 
   */
  public async broadcasterDataProducerHandle(data) {
    const { method, params, broadcasterId } = data;
    const broadcaster = BroadcasterService._broadcasters.get(broadcasterId)

    switch (method) {
      case 'transportclose':
      case 'producerclose':
        broadcaster?.data.dataProducers.delete(params.dataProducerId)
        break;
    }
  }

}
