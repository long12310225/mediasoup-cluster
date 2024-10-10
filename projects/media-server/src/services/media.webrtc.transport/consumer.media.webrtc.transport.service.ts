import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { types } from 'mediasoup';
import { MediasoupWebRTCTransportManager } from './MediasoupWebRTCTransportManager';
import { MediaRouterService } from '../media.router/media.router.service';
import env from '@/config/env';
import * as chalk from 'chalk';

@Injectable()
export class ConsumerMediaWebRTCTransport extends MediasoupWebRTCTransportManager {
  // 缓存 transport
  static transports = new Map<string, types.WebRtcTransport>(); // WebRtcTransport 继承 Transport

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
    const timestrap = new Date().getTime()
    console.time(chalk.bgBlue(`${timestrap} createMediasoupWebRTCTransport create 耗时`))
    const transport = await this.create(data);
    console.timeEnd(chalk.bgBlue(`${timestrap} createMediasoupWebRTCTransport create 耗时`))

    if (!transport) return;

    // 缓存到 transports 中
    const constructor = this.constructor as typeof ConsumerMediaWebRTCTransport;
    constructor.transports.set(transport.id, transport);

    // 返回 transport 部分属性
    const transportData = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters
    }
    // console.log("%c Line:35 🍅 consumer transportData", "color:#ed9ec7", transportData);
    return transportData;
  }

  
  /**
   * 重启ICE协商
   * @param param0 transportId
   * @returns iceParameters
   */
  async webRTCTransportRestartIce({ transportId }: { transportId: string }) {
    console.log("%c consumer.media.webrtc.transport.service webRTCTransportRestartIce");

    // 从缓存中取出 transport
    const webRTCTransport = ConsumerMediaWebRTCTransport.transports.get(transportId);

    if (!webRTCTransport) { 
      console.error(`this webRTCTransport was not found`);
      return;
    }
    
    const iceParameters = await webRTCTransport.restartIce()
    console.log("%c Line:50 🍒 consumer iceParameters", "color:#ea7e5c", iceParameters);
    return iceParameters;
  }

  async getWebRTCTransport(data: { roomId: string }) {
    const mediasoupConsumerWebRTCTransport = ConsumerMediaWebRTCTransport.transports.keys()
    return mediasoupConsumerWebRTCTransport
  }
}
