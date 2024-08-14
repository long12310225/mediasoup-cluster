import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import env from '@/config/env';
import { MediasoupProducerWebRTCTransport } from '../media.webrtc.transport/mediasoup.producer.webrtc.transport.service';
import { fetchApiMaster } from '@/shared/fetch';

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
    appData: any;
    peerId: string
  }) {
    // 从缓存 transports 中取出 transport
    const transport = this.mediasoupProducerWebRTCTransport.get(
      data.transportId
    );
    const { kind, rtpParameters, appData } = data;
    // 创建生产者 producer, 传输生产数据（音视频数据）
    const producer = await transport.produce({
      kind,
      rtpParameters,
      appData
    });

    this.producerHandler(producer, data.peerId)

    // 缓存生产者 producer
    MediaProducerService.producers.set(producer.id, producer);

    // 返回 producer properties
    return {
      id: producer.id,
      kind: producer.kind,
      appData: producer.appData
    };
  }

  producerHandler(producer, peerId) {
    // Set Producer events.
    // producer.on(
    //   'score',
    //   (
    //     score //收到传输质量分数，说明传输进行中
    //   ) => {
    //     // console.debug(
    //     // 	'producer "score" event [producerId:%s, score:%o]',
    //     // 	producer.id, score);

    //     // peer
    //     //   .notify('producerScore', { producerId: producer.id, score }) // 通知生产者，传输质量分数
    //     //   .catch(() => {})
        
    //     // fetchApiMaster({
    //     //   path: '/message/notify',
    //     //   method: 'POST',
    //     //   data: {
    //     //     method: 'producerScore',
    //     //     params: {
    //     //       producerId: producer.id,
    //     //       score
    //     //     },
    //     //     peerId
    //     //   },
    //     // });
    //   }
    // )
    
    // 收到视频方向改变事件
    // producer.on(
    //   'videoorientationchange',
    //   (
    //     videoOrientation 
    //   ) => {
    //     console.debug(
    //       'producer "videoorientationchange" event [producerId:%s, videoOrientation:%o]',
    //       producer.id,
    //       videoOrientation
    //     )
    //   }
    // )
    
    // producer跟踪事件
    // producer.on(
    //   'trace',
    //   (
    //     trace 
    //   ) => {
    //     console.debug(
    //       'producer "trace" event [producerId:%s, trace.type:%s, trace:%o]',
    //       producer.id,
    //       trace.type,
    //       trace
    //     )
    //   }
    // )
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
    // 返回空对象
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
    // 返回空对象
    return {};
  }

  /**
   * 根据 producerId 获取 producer 状态
   * @param data 
   * @returns 
   */
  async getStats(data: { producerId: string }) {
    // 获取 producer 
    const producer = this.get(data);
    const stats = await producer.getStats()
    return stats;
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
    console.error('Producer not found');
    return;
  }

  /**
   * 关闭 producer
   * @param data 
   */
  close(data: { producerId: string }) {
    // 获取 producer 
    const producer = this.get(data);
    producer.close();
    // 返回空对象
    return {};
  }

  getProducers(data) {
    const mediaProducers = MediaProducerService.producers.keys()
    return mediaProducers;
  }
}
