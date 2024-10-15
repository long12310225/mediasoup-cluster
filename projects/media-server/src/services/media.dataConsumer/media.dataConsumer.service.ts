import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { ConsumerMediaWebRTCTransport } from '../media.webrtc.transport/consumer.media.webrtc.transport.service';
import { MediaRouterService } from '../media.router/media.router.service';
import { PinoLogger } from 'nestjs-pino';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class MediaDataConsumerService {
  // 缓存 consumers【等于consumerPeer.data.dataConsumers】
  static dataConsumers = new Map<string, types.DataConsumer>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly axiosService: AxiosService,
    private readonly mediasoupConsumerWebRTCTransport: ConsumerMediaWebRTCTransport,
    private readonly mediaRouterService: MediaRouterService,
  ) {
    this.logger.setContext(MediaDataConsumerService.name)
  }

  /**
   * 创建 dataConsumer
   * @param data
   */
  async createConsumeData(data: {
    transportId: string;
    dataProducerId: string;
    peerId?: string;
    broadcasterId?: string;
  }) {
    try {
      const transport = this.mediasoupConsumerWebRTCTransport.get(data.transportId);
      // 看 transport 是否带有 appData 的 consuming 为 true 的数据
  
      if (!transport) {
        console.warn('createConsumeData() | Transport for consuming not found');
        return;
      }
  
      // https://mediasoup.org/documentation/v3/mediasoup/api/#DataConsumer
      // 消费别人的 transport.produceData 中 appData 的 consuming 为 true
      const dataConsumer = await transport.consumeData({
        dataProducerId: data.dataProducerId,
        paused: true, // 先暂停
      });
  
      if (!dataConsumer) return
  
      if (data?.peerId) {
        this.handleDataConsumer(dataConsumer, data?.peerId);
      } else if (data?.broadcasterId) {
        this.handleBroadcastDataConsumer(dataConsumer, data?.broadcasterId)
      }
  
      // 缓存 dataConsumer
      MediaDataConsumerService.dataConsumers.set(dataConsumer.id, dataConsumer);
  
      // 返回 dataConsumer 信息
      const res = {
        id: dataConsumer.id,
        type: dataConsumer.type,
        dataProducerId: dataConsumer.dataProducerId,
        sctpStreamParameters: dataConsumer.sctpStreamParameters,
        label: dataConsumer.label,
        protocol: dataConsumer.protocol,
        appData: dataConsumer.appData,
      }
      return res;
      
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 一堆 dataConsumer 监听事件
   * @param dataConsumer
   * @param peerId
   */
  handleDataConsumer(dataConsumer, peerId) {
    // Set DataConsumer events.
    dataConsumer.on('transportclose', () => {
      // Remove from its map.
      // dataConsumerPeer.data.dataConsumers.delete(dataConsumer.id)
      // 发起 http 请求
      this.axiosService.fetchApiMaster({
        path: '/peer/dataConsumer/handle',
        method: 'POST',
        data: {
          type: 'transportclose',
          params: {
            dataConsumerId: dataConsumer.id,
          },
          peerId,
        },
      });
    });

    dataConsumer.on('dataproducerclose', () => {

      // dataConsumerPeer.notify('dataConsumerClosed', { dataConsumerId: dataConsumer.id }).catch(() => {})
      this.axiosService.fetchApiMaster({
        path: '/message/notify',
        method: 'POST',
        data: {
          method: 'dataConsumerClosed',
          params: {
            dataConsumerId: dataConsumer.id,
          },
          peerId,
        },
      });
    });
  }

  handleBroadcastDataConsumer(dataConsumer, broadcasterId) {
    dataConsumer.on('transportclose', () => {
      // Remove from its map.
      this.axiosService.fetchApiMaster({
        path: '/broadcast/dataConsumer/handle',
        method: 'POST',
        data: {
          type: 'transportclose',
          params: {
            dataConsumerId: dataConsumer.id,
          },
          broadcasterId,
        },
      });
    });

    dataConsumer.on('dataproducerclose', () => {
      // Remove from its map.
      this.axiosService.fetchApiMaster({
        path: '/broadcast/dataConsumer/handle',
        method: 'POST',
        data: {
          type: 'dataproducerclose',
          params: {
            dataConsumerId: dataConsumer.id,
          },
          broadcasterId,
        },
      });
    });
  }

  /**
   * 根据 dataConsumerId，获取 dataConsumer 状态
   * @param data
   * @returns
   */
  async getStats(data: { dataConsumerId: string }) {
    try {
      // 从缓存中取出 dataConsumer
      const dataConsumer = this.get(data);
      if (!dataConsumer) return 
      
      // 获取 dataConsumer 状态
      const res = await dataConsumer.getStats();
      return res;
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 consumerId 暂停 dataConsumer
   * @param data 
   * @returns 
   */
  async pause(data: { dataConsumerId: string }) {
    try {
      // 从缓存中取出 dataConsumer
      const dataConsumer = this.get(data);
      if (!dataConsumer) return 
  
      // 调用 dataConsumer 的 pause 方法，暂停媒体流
      await dataConsumer.pause();
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 consumerId，恢复 dataConsumer
   * @param data 
   * @returns 
   */
  async resume(data: { dataConsumerId: string }) {
    try {
      // 从缓存中取出 dataConsumer
      const dataConsumer = this.get(data);
      if (!dataConsumer) return 
      
      // 取消暂停服务器端消费者
      await dataConsumer.resume()
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 通过 dataConsumerId 获取 dataConsumer
   * @param data dataConsumerId
   * @returns
   */
  get(data: { dataConsumerId: string }) {
    // 从缓存中取出 dataConsumer
    const dataConsumer = MediaDataConsumerService.dataConsumers.get(data.dataConsumerId);
    if (!dataConsumer) {
      this.logger.error('dataConsumer not found');
      return
    }
    return dataConsumer;
  }

  getDataConsumers(data) {
    const mediaDataConsumers = MediaDataConsumerService.dataConsumers.keys();
    return mediaDataConsumers;
  }
}
