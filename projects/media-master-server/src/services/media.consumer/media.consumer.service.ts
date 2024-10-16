import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { MediasoupConsumerWebRTCTransport } from '../media.webrtc.transport/mediasoup.consumer.webrtc.transport.service';
import { MediaRouterService } from '../media.router/media.router.service';

@Injectable()
export class MediaConsumerService {
  // 缓存 consumers
  static consumers = new Map<string, types.Consumer>();

  constructor(
    private readonly mediasoupConsumerWebRTCTransport: MediasoupConsumerWebRTCTransport,
    private readonly mediaRouterService: MediaRouterService,
  ) { }

  /**
   * 创建 mediasoup consumer
   * @param data 
   * @returns 
   */
  async create(data: {
    routerId: string;
    transportId: string;
    producerId: string;
    rtpCapabilities: types.RtpCapabilities;
  }) {
    // 获取 router
    const router = this.mediaRouterService.get(data.routerId);
    if (
      !router.canConsume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
      })
    ) {
      throw new Error('can not consume');
    }
    // 获取 transport
    const transport = this.mediasoupConsumerWebRTCTransport.get(
      data.transportId
    );
    // 通过 transport 发送 媒体流，返回 consumer
    // https://mediasoup.org/documentation/v3/mediasoup/api/#transport-consume
    const consumer = await transport.consume({
      producerId: data.producerId,
      rtpCapabilities: data.rtpCapabilities,
      paused: true,
    });

    // 缓存 consumer
    MediaConsumerService.consumers.set(consumer.id, consumer);

    // 返回 consumer 信息
    return {
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
    };
  }

  /**
   * 根据 consumerId，取消暂停消费者
   * @param data 
   * @returns 
   */
  async resume(data: { consumerId: string }) {
    // 从缓存中取出 consumer
    const consumer = this.get(data);
    // 取消暂停服务器端消费者
    await consumer.resume();
    // 返回空对象【FIX】
    return {};
  }
  
  /**
   * 通过 consumerId 获取 consumer
   * @param data consumerId
   * @returns 
   */
  get(data: { consumerId: string }) {
    // 从缓存中取出 consumer
    const consumer = MediaConsumerService.consumers.get(data.consumerId);
    if (consumer) {
      return consumer;
    }
    throw new Error('Consumer not found');
  }
}
