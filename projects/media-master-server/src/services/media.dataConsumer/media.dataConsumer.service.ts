import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { MediasoupConsumerWebRTCTransport } from '../media.webrtc.transport/mediasoup.consumer.webrtc.transport.service';
import { MediaRouterService } from '../media.router/media.router.service';
import { fetchApiMaster } from '@/shared/fetch';

@Injectable()
export class MediaDataConsumerService {
  // 缓存 consumers【等于consumerPeer.data.dataConsumers】
  static dataConsumers = new Map<string, types.DataConsumer>();

  constructor(
    private readonly mediasoupConsumerWebRTCTransport: MediasoupConsumerWebRTCTransport,
    private readonly mediaRouterService: MediaRouterService,
  ) {}

  /**
   * 创建 dataConsumer
   * @param data
   */
  async createConsumeData(data: {
    transportId: string;
    dataProducerId: string;
    peerId: string;
  }) {
    // console.log("%c media.dataConsumer.service createConsumeData data:", "color:#42b983", data);

    const transport = this.mediasoupConsumerWebRTCTransport.get(data.transportId);
    // console.log("%c Line:28 🍐 输出所有transport MediasoupConsumerWebRTCTransport.transports", "color:#e41a6a", MediasoupConsumerWebRTCTransport.transports);
    // 看 transport 是否带有 appData 的 consuming 为 true 的数据
    // console.log("%c 🌶 media.dataConsumer.service createConsumeData transport:", "color:#42b983", transport);

    if (!transport) {
      console.warn('createConsumeData() | Transport for consuming not found');
      return;
    }

    let dataConsumer
    // https://mediasoup.org/documentation/v3/mediasoup/api/#DataConsumer
    try {
      // 消费别人的 transport.produceData 中 appData 的 consuming 为 true
      dataConsumer = await transport.consumeData({
        dataProducerId: data.dataProducerId,
        paused: true, // 先暂停
      });
      // console.log("%c Line:45 🥤 dataConsumer", "color:#465975", dataConsumer);
    } catch (error) {
      console.log("%c Line:43 🍫🍫🍫 error", "color:#b03734", error);
      return
    }

    this.dataConsumerHandler(dataConsumer, data.peerId);

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
    // console.log("%c Line:68 🍕 res", "color:#465975", res);
    return res;
  }

  /**
   * 一堆 dataConsumer 监听事件
   * @param dataConsumer
   * @param peerId
   */
  dataConsumerHandler(dataConsumer, peerId) {
    // Set DataConsumer events.
    dataConsumer.on('transportclose', () => {
      // Remove from its map.
      // dataConsumerPeer.data.dataConsumers.delete(dataConsumer.id)
      // 发起 http 请求
      fetchApiMaster({
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
      // Remove from its map.
      // dataConsumerPeer.data.dataConsumers.delete(dataConsumer.id)
      fetchApiMaster({
        path: '/peer/dataConsumer/handle',
        method: 'POST',
        data: {
          type: 'dataproducerclose',
          params: {
            dataConsumerId: dataConsumer.id,
          },
          peerId,
        },
      });

      // dataConsumerPeer.notify('dataConsumerClosed', { dataConsumerId: dataConsumer.id }).catch(() => {})
      fetchApiMaster({
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

  /**
   * 根据 dataConsumerId，获取 dataConsumer 状态
   * @param data
   * @returns
   */
  async getStats(data: { dataConsumerId: string }) {
    // 从缓存中取出 dataConsumer
    const dataConsumer = this.get(data);
    // 获取 dataConsumer 状态
    const res = await dataConsumer.getStats();
    return res;
  }

  /**
   * 根据 consumerId 暂停 dataConsumer
   * @param data 
   * @returns 
   */
  async pause(data: { dataConsumerId: string }) {
    // 从缓存中取出 dataConsumer
    const dataConsumer = this.get(data);
    // 调用 dataConsumer 的 pause 方法，暂停媒体流
    await dataConsumer.pause();
    // 返回空对象
    return {};
  }

  /**
   * 根据 consumerId，恢复 dataConsumer
   * @param data 
   * @returns 
   */
  async resume(data: { dataConsumerId: string }) {
    // 从缓存中取出 dataConsumer
    const dataConsumer = this.get(data);
    // 取消暂停服务器端消费者
    await dataConsumer.resume()
    // 返回空对象
    return {};
  }

  /**
   * 通过 dataConsumerId 获取 dataConsumer
   * @param data dataConsumerId
   * @returns
   */
  get(data: { dataConsumerId: string }) {
    // 从缓存中取出 dataConsumer
    const dataConsumer = MediaDataConsumerService.dataConsumers.get(data.dataConsumerId);
    if (dataConsumer) {
      return dataConsumer;
    }
    console.error('dataConsumer not found');
    return;
  }

  getDataConsumers(data) {
    const mediaDataConsumers = MediaDataConsumerService.dataConsumers.keys();
    return mediaDataConsumers;
  }
}
