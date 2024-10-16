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
   * 创建 consumer transport
   * @param data 
   * @returns 
   */
  async create(data: { routerId: string }) {
    // 获取 router
    const router = this.mediaRouterService.get(data.routerId);
    // 通过 router 创建 pipeTransport
    const transport = await router.createPipeTransport({
      listenIp: env.getEnv('LISTEN_HOST') || '127.0.0.1',
      enableSctp: true,
      numSctpStreams: { OS: 1024, MIS: 1024 },
    });
    // 缓存 transport
    MediaPipeTransportService.transports.set(transport.id, transport);
    // 返回 transport
    return transport;
  }

  async createDestination(data: {
    routerId: string;
    sourceHost: string;
    sourcePort: string;
    sourceRouterId: string;
    sourceProducerId: string;
  }) {
    console.log("%c Line:44 🍋 data", "color:#2eafb0", data);
    const transport = await this.create(data);
    console.log("%c Line:44 🥝 transport", "color:#7f2b82", transport);

    const sourceResult = await fetchApi({
      host: data.sourceHost,
      port: data.sourcePort,
      path: '/routers/:routerId/source_pipe_transports',
      method: 'POST',
      data: {
        routerId: data.sourceRouterId,
        destinationIp: transport.tuple.localIp,
        destinationPort: transport.tuple.localPort,
        destinationSrtpParameters: transport.srtpParameters,
      },
    });

    await transport.connect({
      ip: sourceResult.sourceIp,
      port: sourceResult.sourcePort,
      srtpParameters: sourceResult.sourceSrtpParameters,
    });

    const consumerResult = await fetchApi({
      host: data.sourceHost,
      port: data.sourcePort,
      path: '/pipe_transports/:transportId/consume',
      method: 'POST',
      data: {
        transportId: sourceResult.id,
        producerId: data.sourceProducerId,
      },
    });
    const pipeDataProducer = await transport.produce({
      id: data.sourceProducerId,
      kind: consumerResult.kind,
      rtpParameters: consumerResult.rtpParameters,
      paused: consumerResult.producerPaused,
    });
    return { id: pipeDataProducer.id };
  }

  async createSource(data: {
    routerId: string;
    destinationIp: string;
    destinationPort: number;
    destinationSrtpParameters: types.SrtpParameters;
  }) {
    const transport = await this.create(data);
    await transport.connect({
      ip: data.destinationIp,
      port: data.destinationPort,
      srtpParameters: data.destinationSrtpParameters,
    });
    return {
      id: transport.id,
      sourceIp: transport.tuple.localIp,
      sourcePort: transport.tuple.localPort,
      sourceSrtpParameters: transport.srtpParameters,
    };
  }

  async consume(data: { transportId: string; producerId: string }) {
    const transport = this.get(data);
    const pipeConsumer = await transport.consume({
      producerId: data.producerId,
    });
    return {
      kind: pipeConsumer.kind,
      rtpParameters: pipeConsumer.rtpParameters,
      paused: pipeConsumer.producerPaused,
    };
  }

  get(data: { transportId: string }) {
    const transport = MediaPipeTransportService.transports.get(
      data.transportId
    );
    if (transport) {
      return transport;
    }
    throw new Error('Transport not found');
  }
}
