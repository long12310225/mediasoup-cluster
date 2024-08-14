import { Injectable } from '@nestjs/common';
import { constants } from '@/shared/constants';
import { fetchApi } from '@/shared/fetch'
import { types } from 'mediasoup';
import { MediaRouterService } from '../media.router/media.router.service';
import env from '@/config/env';

@Injectable()
export class MediaPipeTransportService {
  // 缓存 transport
  static transports = new Map<string, types.PipeTransport>();

  constructor(
    private readonly mediaRouterService: MediaRouterService
  ) { }

  /**
   * 创建 pipe transport
   * @param data 
   * @returns 
   */
  async create(data: { routerId: string }) {
    // 获取 router
    const router = this.mediaRouterService.get(data.routerId);
    // 通过 router 创建 pipeTransport
    const transport: types.PipeTransport = await router.createPipeTransport({
      listenIp: env.getEnv('LISTEN_HOST') || '127.0.0.1',
      enableSctp: true,
      numSctpStreams: { OS: 1024, MIS: 1024 },
    });
    // 缓存 transport
    MediaPipeTransportService.transports.set(transport.id, transport);
    // 返回 transport
    return transport;
  }

  /**
   * consumer 服务向 producer 服务创建连接
   * @param data 
   * @returns 
   */
  async createDestination(data: {
    routerId: string;
    sourceHost: string;
    sourcePort: string;
    sourceRouterId: string;
    sourceProducerId: string; // prucuder 待消费的 producerId
  }) {
    console.log("1 🍋 checkToPipe 执行接口 /routers/:routerId/destination_pipe_transports 的方法 data", data);
    
    // consumer 服务创建 pipeTransport
    const transport: types.PipeTransport = await this.create(data);
    
    // consumer 服务向 producer 服务发送 http 请求
    // 此请求，对应的是下方 createSource 函数的内容
    let sourceResult
    try {
      sourceResult = await fetchApi({
        host: data.sourceHost, // prucuder apiHost
        port: data.sourcePort, // prucuder apiPort
        path: '/routers/:routerId/source_pipe_transports',
        method: 'POST',
        data: {
          routerId: data.sourceRouterId, // prucuder routerId
          destinationIp: transport.tuple.localIp, // consumer 服务的 pipeTransport 信息
          destinationPort: transport.tuple.localPort, // consumer 服务的 pipeTransport 信息
          destinationSrtpParameters: transport.srtpParameters, // consumer 服务的 pipeTransport 信息
        }
      });

      if(!sourceResult) return
    
      // transport 连接
      await transport.connect({
        ip: sourceResult.sourceIp, // producer pipeTransport 属性
        port: sourceResult.sourcePort, // producer pipeTransport 属性
        srtpParameters: sourceResult.sourceSrtpParameters, // producer pipeTransport 属性
      });
    } catch (e) {
      console.error("%c Line:67 🍢 e", "color:#ffdd4d", e);
    }

    // consumer 服务向 producer 服务发送 http 请求
    // 通知 producer 服务 transport.consume，返回消费结果
    let consumerResult
    try {
      consumerResult = await fetchApi({
        host: data.sourceHost, // prucuder apiHost
        port: data.sourcePort, // prucuder apiPort
        path: '/pipe_transports/:transportId/consume',
        method: 'POST',
        data: {
          transportId: sourceResult.id, // producer pipeTransport 属性 id
          producerId: data.sourceProducerId, // prucuder 待消费的 producerId
        },
      });
    } catch (e) {
      console.error("%c Line:89 🍌 e", "color:#b03734", e);
    }

    if(!consumerResult) return

    let pipeDataProducer
    try {
      pipeDataProducer = await transport.produce({
        id: data.sourceProducerId, // prucuder 待消费的 producerId
        kind: consumerResult.kind, // producer 服务的消费结果
        rtpParameters: consumerResult.rtpParameters, // producer 服务的消费结果
        paused: consumerResult.producerPaused, // producer 服务的消费结果
      });
    } catch (e) {
      console.error("%c Line:95 🍊 e", "color:#fca650", e);
    }

    return {
      id: pipeDataProducer.id
    };
  }

  /**
   * 
   * @param data 
   * @returns 
   */
  async createDataDestination(data: {
    routerId: string;
    sourceHost: string;
    sourcePort: string;
    sourceRouterId: string;
    sourceDataProducerId: string;
  }) {
    // console.log("%c 接口 /routers/:routerId/data_destination_pipe_transports 的方法 data", data);
    const transport: types.PipeTransport = await this.create(data);
    // console.log("%c Line:105 🌮 transport: types.PipeTransport ==>", "color:#ea7e5c", transport);

    // 调用 createDataSource()
    const sourceResult = await fetchApi({
      host: data.sourceHost,
      port: data.sourcePort,
      path: '/routers/:routerId/data_source_pipe_transports',
      method: 'POST',
      data: {
        routerId: data.sourceRouterId,
        destinationIp: transport.tuple.localIp,
        destinationPort: transport.tuple.localPort,
        destinationSrtpParameters: transport.srtpParameters,
      },
    });

    if(!sourceResult) return

    await transport.connect({
      ip: sourceResult.sourceIp,
      port: sourceResult.sourcePort,
      srtpParameters: sourceResult.sourceSrtpParameters,
    });

    const consumerResult = await fetchApi({
      host: data.sourceHost,
      port: data.sourcePort,
      path: '/pipe_transports/:transportId/data_consume',
      method: 'POST',
      data: {
        transportId: sourceResult.id,
        dataProducerId: data.sourceDataProducerId,
      },
    });

    if(!consumerResult) return

    const pipeDataProducer = await transport.produceData({
      id: data.sourceDataProducerId,
      sctpStreamParameters: consumerResult.sctpStreamParameters,
      label: consumerResult.label,
      protocol: consumerResult.protocol,
      paused: consumerResult.paused,
      appData: consumerResult.appData,
    });

    return {
      id: pipeDataProducer.id
    };
  }

  /**
   * producer 服务创建 pipeTransport，
   * 并调用 connect 连接 consumer 的 pipeTransport，
   * 最后将 producer 服务的 pipeTransport 信息返回。
   * @param data consumer 服务的 pipeTransport 信息
   * @returns 
   */
  async createSource(data: {
    routerId: string; // 无应用到
    destinationIp: string;
    destinationPort: number;
    destinationSrtpParameters: types.SrtpParameters;
  }) {
    // producer 服务创建 pipeTransport
    const transport = await this.create(data);

    // transport 连接
    await transport.connect({
      ip: data.destinationIp, // consumer 服务的 pipeTransport 信息
      port: data.destinationPort, // consumer 服务的 pipeTransport 信息
      srtpParameters: data.destinationSrtpParameters, // consumer 服务的 pipeTransport 信息
    });

    // 返回 producer pipeTransport 属性
    return {
      id: transport.id,
      sourceIp: transport.tuple.localIp,
      sourcePort: transport.tuple.localPort,
      sourceSrtpParameters: transport.srtpParameters,
    };
  }

  async createDataSource(data: {
    routerId: string;
    destinationIp: string;
    destinationPort: number;
    destinationSrtpParameters: types.SrtpParameters;
  }) {
    // 创建 pipeTransport
    const transport: types.PipeTransport = await this.create(data);

    // 连接
    await transport.connect({
      ip: data.destinationIp,
      port: data.destinationPort,
      srtpParameters: data.destinationSrtpParameters,
    });

    // 返回 pipeTransport 属性
    return {
      id: transport.id,
      sourceIp: transport.tuple.localIp,
      sourcePort: transport.tuple.localPort,
      sourceSrtpParameters: transport.srtpParameters,
    };
  }

  /**
   * producer 服务消费流
   * @param data 
   * @returns 
   */
  async consume(data: {
    transportId: string;
    producerId: string // prucuder 待消费的 producerId
  }) {
    // 根据 pipeTransport id 获取对应 pipeTransport
    const transport = this.get(data);

    // producer 服务，transport 消费
    const pipeConsumer = await transport.consume({
      producerId: data.producerId, // prucuder 待消费的 producerId
    });

    // 返回消费结果
    return {
      kind: pipeConsumer.kind,
      rtpParameters: pipeConsumer.rtpParameters,
      paused: pipeConsumer.producerPaused,
    };
  }

  /**
   * 消费流
   * @param data 
   * @returns 
   */
  async dataConsume(data: {
    transportId: string;
    dataProducerId: string
  }) {
    // 根据 pipeTransport id 获取对应 pipeTransport
    const transport = this.get(data);

    // transport 消费对应的 producer
    const pipeConsumerData = await transport.consumeData({
      dataProducerId: data.dataProducerId,
    });

    // 返回消费结果
    return {
      type: pipeConsumerData.type,
      sctpStreamParameters: pipeConsumerData.sctpStreamParameters,
      label: pipeConsumerData.label,
      protocol: pipeConsumerData.protocol,
      paused: pipeConsumerData.paused,
      dataProducerPaused: pipeConsumerData.dataProducerPaused,
      appData: pipeConsumerData.appData,
    };
  }

  get(data: { transportId: string }) {
    const transport = MediaPipeTransportService.transports.get(
      data.transportId
    );
    if (transport) {
      return transport;
    }
    console.error('Transport not found');
    return;
  }
}
