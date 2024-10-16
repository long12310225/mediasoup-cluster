import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import env from '@/config/env';
import { MediasoupProducerWebRTCTransport } from '../media.webrtc.transport/mediasoup.producer.webrtc.transport.service';

@Injectable()
export class MediaProducerService {
  // 缓存 producer
  static producers = new Map<string, types.Producer>();

  constructor(
    private readonly mediasoupProducerWebRTCTransport: MediasoupProducerWebRTCTransport
  ) { }

  /**
   * 创建 producer
   * @param data 
   * @returns 
   */
  async create(data: {
    transportId: string;
    kind: types.MediaKind;
    rtpParameters: types.RtpParameters;
  }) {
    // 从缓存 transports 中取出 transport
    const transport = this.mediasoupProducerWebRTCTransport.get(
      data.transportId
    );
    const { kind, rtpParameters } = data;
    // 创建生产者 producer
    const producer = await transport.produce({ kind, rtpParameters });
    // 缓存生产者 producer
    MediaProducerService.producers.set(producer.id, producer);

    // 返回 producer id
    return { id: producer.id };
  }
  
  /**
   * 根据 producerId 暂停媒体流
   * @param data 
   * @returns 
   */
  async pause(data: { producerId: string }) {
    // 获取 producer 
    const producer = this.get(data);
    // 调用 producer 的 pause 方法，暂停媒体流
    await producer.pause();
    // 返回空对象【FIX】
    return {};
  }

  /**
   * 根据 producerId 重连媒体流
   * @param data 
   * @returns 
   */
   async resume(data: { producerId: string }) {
    // 获取 producer 
    const producer = this.get(data);
    // 调用 producer 的 resume 方法，重连媒体流
    await producer.resume();
    // 返回空对象【FIX】
    return {};
  }

  /**
   * 根据 producerId 获取 producer
   */
  get(data: { producerId: string }) {
    // 从缓存中取出 producer
    const producer = MediaProducerService.producers.get(data.producerId);
    if (producer) {
      return producer;
    }
    throw new Error('Producer not found');
  }
}
