import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { types } from 'mediasoup';
import { MediasoupWebRTCTransportManager } from './MediasoupWebRTCTransportManager'
import { MediaRouterService } from '../media.router/media.router.service'
import env from '@/config/env';

@Injectable()
export class ProducerMediaWebRTCTransport extends MediasoupWebRTCTransportManager {
  static transports = new Map<string, types.WebRtcTransport>();
  
  /**
   * 创建 mediasoup producer webRTCtransport
   * @param {{ routerId: string, webRtcTransportOptions: Object } } data
   * @returns 
   */
  async createMediasoupWebRTCTransport(data: {
    routerId: string,
    webRtcTransportOptions: Object,
    peerId?: string
  }) {
    const transport = await this.create(data);
    
    // 缓存到 transports 中
    const constructor = this.constructor as typeof ProducerMediaWebRTCTransport;
    constructor.transports.set(transport.id, transport);

    // 返回 transport 部分属性
    const transportData = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters
    }
    // console.log("%c Line:35 🍤 producer transportData", "color:#fca650", transportData);
    return transportData;
  }

  /**
   * 重启ICE协商
   * @param param0 transportId
   * @returns iceParameters
   */
  async webRTCTransportRestartIce({ transportId }: { transportId: string }) {
    console.log("%c producer.media.webrtc.transport.service webRTCTransportRestartIce");

    // 从缓存中取出 transport
    const webRTCTransport = ProducerMediaWebRTCTransport.transports.get(transportId);

    if (!webRTCTransport) { 
      console.error(`this webRTCTransport was not found`);
      return;
    }

    const iceParameters = await webRTCTransport.restartIce()
    console.log("%c Line:50 🥥 producer iceParameters", "color:#f5ce50", iceParameters);
    return iceParameters;
  }

  async getWebRTCTransport(data: { roomId: string }) {
    const mediasoupProducerWebRTCTransports = ProducerMediaWebRTCTransport.transports.keys()
    return mediasoupProducerWebRTCTransports
  }
}
