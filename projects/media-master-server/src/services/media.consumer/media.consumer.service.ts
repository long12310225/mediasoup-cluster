import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { ConsumerMediaWebRTCTransport } from '../media.webrtc.transport/consumer.media.webrtc.transport.service';
import { MediaRouterService } from '../media.router/media.router.service';
import { MediaPlainTransportService } from '../media.plain.transport/media.plain.transport.service';
import { PinoLogger } from 'nestjs-pino';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class MediaConsumerService {
  // 缓存 consumers【等于consumerPeer.data.consumers】
  static consumers = new Map<string, types.Consumer>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly axiosService: AxiosService,
    private readonly mediasoupConsumerWebRTCTransport: ConsumerMediaWebRTCTransport,
    private readonly mediaPlainTransportService: MediaPlainTransportService,
    private readonly mediaRouterService: MediaRouterService,
  ) { 
    this.logger.setContext(MediaConsumerService.name)
  }

  /**
   * 创建 mediasoup consumer
   * @param data 
   * @returns { {
   *   id: consumer.id,
   *   kind: consumer.kind,
   *   rtpParameters: consumer.rtpParameters,
   *   type: consumer.type,
   *   producerPaused: consumer.producerPaused,
   * } } consumer 对象中的信息
   */
  async create(data: {
    routerId: string;
    transportId: string;
    producerId: string;
    rtpCapabilities: types.RtpCapabilities;
    peerId?: string;
    broadcasterId?: string;
  }) {
    // 获取 router
    const router = this.mediaRouterService.get(data.routerId);

    if (
      !router &&
      !router.canConsume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
      })
    ) {
      return
    }

    // 获取 transport
    let transport
    if (data?.peerId) {
      transport = this.mediasoupConsumerWebRTCTransport.get(
        data.transportId
      );
    } else if(data?.broadcasterId) {
      transport = this.mediaPlainTransportService.get(
        data.transportId
      );
      // console.log("%c Line:373 🥥 5 创建 consumer -- create get transport: ", "color:#f5ce50", transport);
    }
    
    if (!transport) return

    // 创建一个 consumer 实例
    let consumer
    try {
      // 通过 transport 发送 媒体流，返回 consumer
      // https://mediasoup.org/documentation/v3/mediasoup/api/#transport-consume
      consumer = await transport.consume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
        paused: true,
      });
    } catch (e) {
      this.logger.error(e)
      return
    }

    if (!consumer) return

    // 缓存 consumer
    MediaConsumerService.consumers.set(consumer.id, consumer);
    // console.log("%c Line:373 🥥 5 创建 consumer -- create MediaConsumerService.consumers: ", "color:#f5ce50", MediaConsumerService.consumers);
     
    if (data?.peerId) {
      this.handleConsumer(consumer, data?.peerId);
    } else if(data?.broadcasterId) {
      this.handleBroadcastConsumer(consumer, data?.broadcasterId)
    }

    // 返回 consumer 信息
    return {
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
      score: consumer.score
    };
  }

  /**
   * 一堆 consumer 监听事件
   * @param consumer 
   * @param peerId 
   */
  handleConsumer(consumer, peerId) {
    // consumerPeer.data.consumers.delete(consumer.id)
    consumer.on('transportclose', () => {
      // 发起 http 请求，向主应用传递事件
      this.axiosService.fetchApiMaster({
        path: '/peer/consumer/handle',
        method: 'POST',
        data: {
          method: 'transportclose',
          params: {
            consumerId: consumer.id
          },
          peerId
        }
      });
    })

    consumer.on('producerclose', () => {
      // consumerPeer.data.consumers.delete(consumer.id)
      // 发起 http 请求，向主应用传递事件
      this.axiosService.fetchApiMaster({
        path: '/peer/consumer/handle',
        method: 'POST',
        data: {
          method: 'producerclose',
          params: {
            consumerId: consumer.id,
          },
          peerId
        }
      });

      // 调用 peer.notify() 发送一条 notification 消息给客户端
      // consumerPeer.notify('consumerClosed', {
      //   consumerId: consumer.id
      // }).catch(() => { })
      this.axiosService.fetchApiMaster({
        path: '/message/notify',
        method: 'POST',
        data: {
          method: 'consumerClosed',
          params: {
            consumerId: consumer.id
          },
          peerId
        },
      });
    })

    consumer.on('producerpause', () => {
      // console.log("%c Line:151 🌽", "color:#4fff4B");
      // consumerPeer.notify('consumerPaused', {
      //   consumerId: consumer.id
      // }).catch(() => { })
      this.axiosService.fetchApiMaster({
        path: '/message/notify',
        method: 'POST',
        data: {
          method: 'consumerPaused',
          params: {
            consumerId: consumer.id
          },
          peerId
        },
      });
    })

    consumer.on('producerresume', () => {
      // console.log("%c Line:170 🌮", "color:#42b983");
      // consumerPeer.notify('consumerResumed', {
      //   consumerId: consumer.id
      // }).catch(() => { })
      this.axiosService.fetchApiMaster({
        path: '/message/notify',
        method: 'POST',
        data: {
          method: 'consumerResumed',
          params: {
            consumerId: consumer.id
          },
          peerId
        },
      });
    })

    consumer.on('score', (score) => {
      // console.log("%c Line:184 🥝 score", "color:#fca650", score);
      // consumerPeer.notify('consumerScore', {
      //   consumerId: consumer.id, score
      // }).catch(() => { })
      
      this.axiosService.fetchApiMaster({
        path: '/message/notify',
        method: 'POST',
        data: {
          method: 'consumerScore',
          params: {
            consumerId: consumer.id,
            score
          },
          peerId
        },
      });
    })

    // consumer.on('layerschange', (layers) => {
    //   // console.log("%c Line:208 🍣", "color:#ea7e5c", layers);
    //   // consumerPeer.notify('consumerLayersChanged', {
    //   //   consumerId: consumer.id,
    //   //   spatialLayer: layers ? layers.spatialLayer : null,
    //   //   temporalLayer: layers ? layers.temporalLayer : null,
    //   // }).catch(() => { })

    //   // this.axiosService.fetchApiMaster({
    //   //   path: '/message/notify',
    //   //   method: 'POST',
    //   //   data: {
    //   //     method: 'consumerLayersChanged',
    //   //     params: {
    //   //       consumerId: consumer.id,
    //   //       spatialLayer: layers ? layers.spatialLayer : null,
    //   //       temporalLayer: layers ? layers.temporalLayer : null,
    //   //     },
    //   //     peerId
    //   //   },
    //   // });
    // })

    // consumer.on('trace', (trace) => {
    //   console.debug('consumer "trace" event [producerId:%s, trace.type:%s, trace:%o]', consumer.id, trace.type, trace)
    // })
  }

  handleBroadcastConsumer(consumer, broadcasterId) {
    consumer.on('transportclose', () => {
      // 发起 http 请求，向主应用传递事件
      this.axiosService.fetchApiMaster({
        path: '/broadcast/consumer/handle',
        method: 'POST',
        data: {
          method: 'transportclose',
          params: {
            consumerId: consumer.id
          },
          broadcasterId
        }
      });
    })

    consumer.on('producerclose', () => {
      // 发起 http 请求，向主应用传递事件
      this.axiosService.fetchApiMaster({
        path: '/broadcast/consumer/handle',
        method: 'POST',
        data: {
          method: 'producerclose',
          params: {
            consumerId: consumer.id,
          },
          broadcasterId
        }
      });
    });
  
  }

  /**
   * 根据 consumerId 暂停媒体流
   * @param data 
   * @returns 
   */
  async pause(data: { consumerId: string }) {
    try {
      // 获取 consumer 
      const consumer = this.get(data);
      // console.log("%c Line:92 测试 consumer pause", "color:#ffdd4d", consumer);
      if (!consumer) return
      // 调用 consumer 的 pause 方法，暂停媒体流
      await consumer.pause();
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 consumerId，取消暂停消费者
   * @param data 
   * @returns 
   */
  async resume(data: { consumerId: string }) {
    try {
      // console.log("%c Line:373 🌰 6 消费 consumer -- resume data", "color:#f5ce50", data);
      // 从缓存中取出 consumer
      const consumer = this.get(data);
      // console.log("%c Line:373 🌰 6 消费 consumer -- resume consumer", "color:#f5ce50", consumer);
      if (!consumer) return

      // 取消暂停服务器端消费者
      await consumer.resume();

      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 consumerId，获取 consumer 状态
   * @param data 
   * @returns 
   */
  async getStats(data: { consumerId: string }) {
    try {
      // 从缓存中取出 consumer
      const consumer = this.get(data);
      if (!consumer) return

      // 获取 consumer 状态
      const res = await consumer.getStats();
      return res;
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 consumerId，设置消费优先级
   * @param data 
   * @returns 
   */
  async setPriority({ consumerId, priority }: { consumerId: string, priority: any}) {
    try {
      // 从缓存中取出 consumer
      const consumer = this.get({ consumerId });
      if (!consumer) return

      // 设置消费优先级
      await consumer.setPriority(priority);
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 consumerId，设置消费首选图层
   * @param data 
   * @returns 
   */
  async setPreferredLayers({ consumerId, spatialLayer, temporalLayer }: {
    consumerId: string,
    spatialLayer: any,
    temporalLayer: any
  }) {
    try {
      // 从缓存中取出 consumer
      const consumer = this.get({ consumerId });
      if (!consumer) return
      // 设置消费首选图层
      await consumer.setPreferredLayers({ spatialLayer, temporalLayer }) 
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 consumerId，设置请求消费关键帧
   * @param data 
   * @returns 
   */
  async requestKeyFrame({ consumerId }: {
    consumerId: string,
  }) {
    try {
      // 从缓存中取出 consumer
      const consumer = this.get({ consumerId });
      if (!consumer) return
      // 设置请求消费关键帧
      await consumer.requestKeyFrame()
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }
  
  /**
   * 通过 consumerId 获取 consumer
   * @param data consumerId
   * @returns 
   */
  get(data: { consumerId: string }) {
    // 从缓存中取出 consumer
    const consumer = MediaConsumerService.consumers.get(data.consumerId);
    if (!consumer) {
      this.logger.error('consumer not found');
      return;
    }
    return consumer;
  }

  getConsumers(data) {
    const mediaConsumers = MediaConsumerService.consumers.keys()
    return mediaConsumers;
  }

}
