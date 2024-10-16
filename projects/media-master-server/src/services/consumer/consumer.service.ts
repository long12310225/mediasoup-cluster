import { Injectable } from '@nestjs/common';
import { constants } from '@/shared/constants';
import { fetchApi } from '@/shared/fetch'

import { TransportService } from '@/services/transport/transport.service';
import { RouterService } from '../router/router.service';
import { MediaConsumer } from '@/dao/consumer/media.consumer.do';


@Injectable()
export class ConsumerService {
  constructor(
    private readonly transportService: TransportService,
    private readonly routerService: RouterService
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
    console.log("%c Line:33 🥟 data", "color:#3f7cff", data);
    // 创建 transport service，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: data.transportId,
    });
    console.log("%c Line:40 🍬 transport", "color:#33a5ff", transport);
    // 如果类型是'consumer'
    if (transport.type === constants.CONSUMER) {
      // 创建 router service，并调用实例方法 checkToPipe
      await this.routerService.checkToPipe({
        routerId: transport.routerId,
        producerId: data.producerId,
      });

      // 发起 http，返回 mediasoup consumer
      const result = await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/transports/:transportId/consumer',
        method: 'POST',
        data: {
          transportId: transport.id,
          routerId: transport.routerId,
          producerId: data.producerId,
          rtpCapabilities: data.rtpCapabilities,
        },
      });

      // 创建 MediaConsumer 实例，存入数据
      const consumer = new MediaConsumer();
      consumer.id = result.id;
      consumer.producerId = data.producerId;
      consumer.transportId = transport.id;

      // 保存 MediaConsumer 实例到数据库
      await MediaConsumer.getRepository().save(consumer);

      // 返回 mediasoup consumer
      return result;
    }
    throw new Error('Invalid type transport');
  }

  /**
   * 通过 consumerId 重新开始
   * @param data 
   * @returns 
   */
  async resume(data: { consumerId: string }) {
    // 获取 consumer
    const consumer = await this.get(data);
    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: consumer.transportId,
    });
    // 如果类型是 consumer
    if (transport.type === constants.CONSUMER) {
      // 发起 http
      await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumers/:consumerId/resume',
        method: 'POST',
        data: { consumerId: data.consumerId },
      });
      // 返回空对象【FIX】
      return {};
    }
    throw new Error('Invalid transport');
  }

  /**
   * 根据 consumerId 获取 consumer
   * @param data consumerId
   * @returns 
   */
  async get(data: { consumerId: string }) {
    // 查询数据库获取 consumer
    const consumer = await MediaConsumer
      .getRepository()
      .findOne({
        where: { id: data.consumerId },
      });
    if (consumer) {
      return consumer;
    }
    throw new Error('Consumer not found');
  }
}
