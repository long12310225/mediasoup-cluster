import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { types } from 'mediasoup';
import { MediasoupWebRTCTransportManager } from './MediasoupWebRTCTransportManager'
import { MediaRouterService } from '../media.router/media.router.service'
import env from '@/config/env';

@Injectable()
export class MediasoupProducerWebRTCTransport extends MediasoupWebRTCTransportManager {
  static transports = new Map<string, types.Transport>();

  constructor(
    private readonly mediaRouterService: MediaRouterService
  ) { 
    super()
  }

  /**
   * 创建 transport
   * @param data routerId
   * @returns 
   */
  async create(data: { routerId: string }) {
    // 根据 routerId 从 mediasoupRouterManager 中获取出相关 router
    const router = this.mediaRouterService.get(data.routerId);

    /* 准备数据 */
    // 最大 incoming 位数
    const maxIncomingBitrate =
      Number(env.getEnv('MEDIASOUP_WEBRTC_TRANSPORT_MAX_INCOMING_BITRATE')) ||
      1500000;
    // outgoint 位数
    const initialAvailableOutgoingBitrate =
      Number(
        env.getEnv('MEDIASOUP_WEBRTC_TRANSPORT_INITIAL_AVAILABLE_OUTGOING_BITRATE')
      ) || 1000000;
    // listenIps
    const listenIps = JSON.parse(
      env.getEnv('MEDIASOUP_WEBRTC_TRANSPORT_LISTEN_IPS') || '[]'
    );

    // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
    // 创建一个 webRtc 传输对象
    const transport = await router.createWebRtcTransport({
      listenIps: listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });
    // 给传输对象设置最大位数
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {}
    }

    // 缓存到 transports 中
    const constructor = this.constructor as typeof MediasoupProducerWebRTCTransport;
    constructor.transports.set(transport.id, transport);

    // 返回 transport 部分属性
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }
}
