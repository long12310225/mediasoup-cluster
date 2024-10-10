import { Injectable } from '@nestjs/common';
import { CONSTANTS } from '@/common/enum';

import { TransportService } from '@/services/transport/transport.service';
import { RouterService } from '../router/router.service';
import { MediaConsumer } from '@/dao/consumer/media.consumer.do';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { CreateConsumerDo, ConsumerDo } from '@/dto';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class ConsumerService {
  constructor(
    @InjectPinoLogger(ConsumerService.name)
    private readonly logger: PinoLogger,
    private readonly transportService: TransportService,
    private readonly routerService: RouterService,
    private readonly axiosService: AxiosService
  ) { }

  /**
   * 创建 mediasoup consumer
   * @param data 
   * @returns 
   */
  async create(data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
  }): Promise<{
    /**
     * Consumer id
     */
    id: string;
  }> {
    // 创建 transport service，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: data.transportId,
    });
    // 如果类型是'consumer'
    if (transport.type === CONSTANTS.CONSUMER) {
      // 创建 router service，并调用实例方法 checkToPipe
      await this.routerService.checkToPipe({
        routerId: transport.routerId,
        producerId: data.producerId,
      });

      // 发起 http，返回 mediasoup consumer
      const result = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:transportId/consumer',
        method: 'POST',
        data: {
          transportId: transport.id,
          routerId: transport.routerId,
          producerId: data.producerId,
          rtpCapabilities: data.rtpCapabilities,
        },
      });

      if(!result) return

      // 创建 MediaConsumer 实例，存入数据库
      const consumer = new MediaConsumer();
      consumer.id = result.id;
      consumer.producerId = data.producerId;
      consumer.transportId = transport.id;

      // 保存 MediaConsumer 实例到数据库
      await MediaConsumer.getRepository().save(consumer);

      // 返回 mediasoup consumer
      return result;
    }
    this.logger.error('transport 类型不对，请检查');
    return;
  }

  /**
   * 创建 mediasoup consumer
   * @param data 
   * @returns 
   */
  public async createConsumer (data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
    peerId?: string;
    broadcasterId?: string;
  }): Promise<
    /**
     * Consumer
     */
    any
    > {
    // 获取 transport（consumer）
    const transport = await this.transportService.get({
      transportId: data.transportId,
    });
    
    // 如果类型是'consumer'
    if (transport.type === CONSTANTS.CONSUMER) {
      /**
       * 通过 consumer 的 transport，找到对应的 router（找到对应的worder）
       * 通过 router 关联的 roomId，找到对应的 room（找到对应的worder）
       * 
       * 向 consumer 服务发起请求，创建 pipeTransport，并 transport.connect；
       * consumer 服务向 producer 服务发起请求，创建 pipeTransport，并 transport.connect。
       * 
       * consumer 服务向 producer 服务发请求，通知 producer 服务 transport.consume，返回消费结果；
       * 
       * consumer 服务 transport.produce
       */
      await this.routerService.checkToPipe({
        routerId: transport.routerId,
        producerId: data.producerId,
      });

      const params = {
        transportId: transport.id,
        routerId: transport.routerId,
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
        peerId: data?.peerId,
        broadcasterId: data?.broadcasterId
      }
      // console.log("%c consumer.service.ts createConsumer() 🍩 执行接口 /consumers/:transportId/consumer params:", params);
      /**
       * 上面创建 pipeTransport 准备就绪后，向 consumer 服务发起请求，通知 consumer 服务进行消费
       */
      // 发起 http，创建 mediasoup consumer
      const result = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:transportId/consumer',
        method: 'POST',
        data: params,
      });
      // console.log("2 consumer.service.ts createConsumer()接口 /consumers/:transportId/consumer: 结果consumer=", result);
      
      if(!result) return

      // 创建 MediaConsumer 实例，存入数据库
      const consumer = new MediaConsumer();
      consumer.id = result.id;
      consumer.producerId = data.producerId;
      consumer.transportId = transport.id;
      consumer.type = CONSTANTS.CONSUMER;

      // 保存 MediaConsumer 实例到数据库
      await MediaConsumer.getRepository().save(consumer);

      // 返回 mediasoup consumer
      return result;
    }
    this.logger.error('transport 类型不对，请检查');
    return;
  }

  /**
   * 根据 consumerId 暂停媒体流
   * @param data 
   * @returns 
   */
  public async pause(data: ConsumerDo) {
    // 获取 consumer
    const consumer = await this.get(data);
    if(!consumer) return

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });
    if (!transport) return

    // 发起 http 访问 consumer 服务器（转发） 
    await this.axiosService.fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/consumers/:consumerId/pause',
      method: 'POST',
      data: { consumerId: data.consumerId },
    });

    // 返回空对象
    return {};
  }

  /**
   * 通过 consumerId 重新开始
   * @param data
   * @returns
   */
  public async resume(data: ConsumerDo) {
    // console.log("%c consumer.service.ts resume data", "color:#465975", data);

    // 获取 consumer
    const consumer = await this.get(data);
    if(!consumer) return

    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });
    
    // 如果类型是 consumer
    if (transport?.type === CONSTANTS.CONSUMER) {
      // 发起 http
      const res = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:consumerId/resume',
        method: 'POST',
        data: {
          consumerId: consumer.id
        },
      });
      // console.log("%c Line:184 🍒 res", "color:#ea7e5c", res);
      // 返回空对象
      return {};
    }
    this.logger.error('transport 类型不对，请检查');
    return;
  }

  /**
   * 通过 consumerId 重新开始
   * @param data 
   * @returns 
   */
  public async setPreferredLayers(data: {
    consumerId: string,
    spatialLayer: any,
    temporalLayer: any
  }) {
    // 获取 consumer
    const consumer = await this.get(data);
    if (!consumer) return
    
    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });

    // 如果类型是 consumer
    if (transport?.type === CONSTANTS.CONSUMER) {
      // 发起 http
      await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:consumerId/setPreferredLayers',
        method: 'POST',
        data: {
          consumerId: data.consumerId,
          spatialLayer: data.spatialLayer,
          temporalLayer: data.temporalLayer
        },
      });
      // 返回空对象
      return {};
    }
    this.logger.error('transport 类型不对，请检查');
    return;
  }

  /**
   * 根据 consumerId，设置消费优先级
   * @param data 
   * @returns 
   */
  public async setPriority(data: {
    consumerId: string,
    priority: any
  }) {
    // 获取 consumer
    const consumer = await this.get(data);
    if (!consumer) return

    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });
    // 如果类型是 consumer
    if (transport?.type === CONSTANTS.CONSUMER) {
      // 发起 http
      await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:consumerId/setPriority',
        method: 'POST',
        data: {
          consumerId: data.consumerId,
          priority: data.priority,
        },
      });
      // 返回空对象
      return {};
    }
    this.logger.error('transport 类型不对，请检查');
    return;
  }

  /**
   * 根据 consumerId，设置请求消费关键帧
   * @param data 
   * @returns 
   */
  public async requestKeyFrame(data: {
    consumerId: string,
  }) {
    // 获取 consumer
    const consumer = await this.get(data);
    if (!consumer) return

    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });
    // 如果类型是 consumer
    if (transport?.type === CONSTANTS.CONSUMER) {
      // 发起 http
      await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:consumerId/requestKeyFrame',
        method: 'POST',
        data: {
          consumerId: data.consumerId,
        },
      });
      // 返回空对象
      return {};
    }
    this.logger.error('transport 类型不对，请检查');
    return;
  }

  /**
   * 根据 consumerId 获取 consumer 状态
   * @param data 
   * @returns 
   */
  public async getStats({ consumerId }: ConsumerDo) {
    // 获取 consumer
    const consumer = await this.get({ consumerId });
    if (!consumer) return

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });
    if(!transport) return

    // 发起 http 访问 consumer 服务器（转发） 
    const res = await this.axiosService.fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/consumers/:consumerId/getStats',
      method: 'POST',
      data: {
        consumerId
      },
    });
    return res;
  }

  /**
   * 根据 consumerId 获取 consumer
   * @param data consumerId
   * @returns 
   */
  public async get(data: ConsumerDo) {
    // 查询数据库获取 consumer
    const consumer = await MediaConsumer
      .getRepository()
      .findOne({
        where: { id: data.consumerId },
      });
    if (!consumer) {
      this.logger.warn(`media_consumer表中没有 ${data.consumerId} 这条数据`);
      return;
    }
    return consumer;
  }

  /**
   * 创建 broadcaster consumer
   * @param data 
   * @returns 
   */
  public async createBroadcasterConsumer (data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
    broadcasterId?: string;
  }): Promise<
    /**
     * Consumer
     */
    any
    > {
    // 获取 transport
    const transport = await this.transportService.get({
      transportId: data.transportId,
    });
    // console.log("%c Line:373 🥥 5 创建 consumer -- createBroadcasterConsumer transport", "color:#f5ce50", transport);
    
    if (transport?.type === CONSTANTS.PRODUCER) {
      const params = {
        transportId: transport.id,
        routerId: transport.routerId,
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
        broadcasterId: data?.broadcasterId
      }
      // 发起 http，创建 mediasoup consumer
      const result = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:transportId/consumer',
        method: 'POST',
        data: params,
      });
      // console.log("%c Line:373 🥥 5 创建 consumer -- createBroadcasterConsumer result", "color:#f5ce50", result);
      
      if(!result) return

      // 创建 MediaConsumer 实例，存入数据库
      const consumer = new MediaConsumer();
      consumer.id = result.id;
      consumer.producerId = data.producerId;
      consumer.transportId = transport.id;
      consumer.type = CONSTANTS.PRODUCER;

      // 保存 MediaConsumer 实例到数据库
      await MediaConsumer.getRepository().save(consumer);

      // 返回 mediasoup consumer
      return result;
    }
    this.logger.error('transport 类型不对，请检查');
    return;
  }

  /**
   * 通过 consumerId 重新开始
   * @param data
   * @returns
   */
  public async broadcasterConsumerResume(data: ConsumerDo) {

    // 获取 consumer
    const consumer = await this.get(data);
    // console.log("%c Line:373 🌰 6 消费 consumer -- broadcasterConsumerResume consumer", "color:#f5ce50", consumer);
    if (!consumer) return
    
    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });
    
    // 如果类型是 consumer
    if (transport?.type === CONSTANTS.PRODUCER) {
      // 发起 http
      const res = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:consumerId/resume',
        method: 'POST',
        data: {
          consumerId: consumer.id
        },
      });
      // console.log("%c Line:373 🌰 6 消费 consumer -- broadcasterConsumerResume res", "color:#f5ce50", res);
     
      // 返回空对象
      return {};
    }
    this.logger.error('transport 类型不对，请检查');
    return;
  }
  
  public async getConsumerByProducerId(data: { producerId: string }) {
    // 查询数据库获取 consumer
    const consumer = await MediaConsumer
      .getRepository()
      .findOne({
        where: { producerId: data.producerId },
      });
    if (!consumer) {
      this.logger.warn(`media_consumer表中没有 producerId: ${data.producerId} 这条数据`);
      return;
    }
    return consumer;
  }

  /**
   * 关闭 consumer
   * @param data 
   */
  public async closeConsumer(data: { producerId: string }) {
    // 获取 consumer
    const consumer = await this.getConsumerByProducerId(data);
    console.log('consumer: ===============', consumer);
    if(!consumer) return

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });
    console.log('transport: ===============', transport);
    if (!transport) return

    // 发起 http 访问 consumer 服务器（转发） 
    const res = await this.axiosService.fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/consumers/:consumerId/close',
      method: 'POST',
      data: {
        consumerId: consumer.id
      },
    });
    if (res) {
      // 移除数据库数据
      await this.deleteConsumer({
        consumerId: consumer.id
      });
      return res;
    }
    return;
  }

  /**
   * 删除数据表条目
   */
  public async deleteConsumer(data: { consumerId: string }) {
    try {
      // 获取 consumer
      const consumer = await this.get(data);
      if (!consumer) return;
      const res = await MediaConsumer.getRepository().delete({
        id: data.consumerId
      });

      console.log("%c Line:547 🍰 删除数据库 consumer res", "color:#42b983", res);
      if (res?.affected) {
        return {
          msg: '删除成功'
        }
      } else {
        return {
          msg: '删除失败'
        }
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
