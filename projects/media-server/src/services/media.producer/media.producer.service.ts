import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import env from '@/config/env';
import { ProducerMediaWebRTCTransport } from '../media.webrtc.transport/producer.media.webrtc.transport.service';
import { PinoLogger } from 'nestjs-pino';
import { CreateProducerDo, ProducerDo } from '@/dto';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class MediaProducerService {
  // 缓存 producer
  static producers = new Map<string, types.Producer>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly axiosService: AxiosService,
    private readonly mediasoupProducerWebRTCTransport: ProducerMediaWebRTCTransport
  ) { 
    this.logger.setContext(MediaProducerService.name)
  }

  /**
   * 创建 producer
   * @param data 
   * @returns 
   */
  async create(data: CreateProducerDo) {
    try {
      const { kind, rtpParameters } = data;
      // 从缓存 transports 中取出 transport
      const transport = this.mediasoupProducerWebRTCTransport.get(
        data.transportId
      );
      if (!transport) return
    
      // 创建生产者 producer, 传输生产数据（音视频数据）
      const producer = await transport.produce({
        kind,
        rtpParameters,
        appData: data?.appData
      });

      if(data?.peerId) this.producerHandler(producer, data?.peerId)

      // 缓存生产者 producer
      MediaProducerService.producers.set(producer.id, producer);

      // 返回 producer properties
      return {
        id: producer.id,
        kind: producer.kind,
        appData: producer?.appData
      };
    } catch (e) {
      this.logger.error(e)
    }
  }

  producerHandler(producer, peerId) {
    // Set Producer events.
    producer.on(
      'score',
      (
        score //收到传输质量分数，说明传输进行中
      ) => {
        // console.debug(
        // 	'producer "score" event [producerId:%s, score:%o]',
        // 	producer.id, score);

        // peer
        //   .notify('producerScore', { producerId: producer.id, score }) // 通知生产者，传输质量分数
        //   .catch(() => {})
        
        this.axiosService.fetchApiMaster({
          path: '/message/notify',
          method: 'POST',
          data: {
            method: 'producerScore',
            params: {
              producerId: producer.id,
              score
            },
            peerId
          },
        });
      }
    )
    
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
  async pause(data: ProducerDo) {
    try {
      // 获取 producer 
      const producer = this.get(data);
      // 调用 producer 的 pause 方法，暂停媒体流
      await producer.pause();
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 producerId 重连媒体流
   * @param data 
   * @returns 
   */
  async resume(data: ProducerDo) {
    try {
      // 获取 producer 
      const producer = this.get(data);
      if (!producer) return
      
      // 调用 producer 的 resume 方法，重连媒体流
      await producer.resume();
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 producerId 获取 producer 状态
   * @param data 
   * @returns 
   */
  async getStats(data: ProducerDo) {
    try {
      // 获取 producer 
      const producer = this.get(data);
      if (!producer) return
  
      const stats = await producer.getStats()
      return stats;
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 producerId 获取 producer
   */
  get(data: ProducerDo) {
    // 从缓存中取出 producer
    const producer = MediaProducerService.producers.get(data.producerId);
    if (!producer) {
      this.logger.warn('缓存中没有找到相关 producer');
      return;
    }
    return producer;
  }

  /**
   * 关闭 producer
   * @param data 
   */
  public async close(data: ProducerDo) {
    try {
      // 获取 producer 
      const producer = this.get(data);
      if (!producer) return;
      // 关闭 producer
      producer.close();
      return {
        msg: "producer closed successfully"
      };
    } catch (e) {
      this.logger.error(e)
    }
  }

  getProducers(data) {
    const mediaProducers = MediaProducerService.producers.keys()
    return mediaProducers;
  }
}
