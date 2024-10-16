import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaRoom } from '@/dao/room/media.room.do';
import { types } from 'mediasoup';
import { constants } from '@/shared/constants';
import { fetchApi } from '@/shared/fetch'

import { TransportService } from '@/services/transport/transport.service';
import { MediaProducer } from '@/dao/producer/media.producer.do';

@Injectable()
export class ProducerService {
  constructor(
    private readonly transportService: TransportService
  ) { }

  /**
   * 创建 producer
   * @param data 
   * @returns 
   */
  async create(data: {
    transportId: string;
    kind: any;
    rtpParameters: any;
  }): Promise<{
    /**
     * Producer id
     */
    id: string;
  }> {
    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: data.transportId,
    });

    // 如果类型是 producer
    if (transport.type === constants.PRODUCER) {
      // 发起 http 转发到 producer 服务中，创建 producer
      const result = await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/transports/:transportId/producer',
        method: 'POST',
        data: {
          transportId: transport.id,
          kind: data.kind,
          rtpParameters: data.rtpParameters,
        },
      });

      // 创建 MediaProducer 实例
      const producer = new MediaProducer();
      producer.id = result.id;
      producer.kind = data.kind;
      producer.transportId = transport.id;

      // 保存入库
      await MediaProducer.getRepository().save(producer);

      // 返回 producer
      return result;
    }
    throw new Error('Invalid transport');
  }

  /**
   * 根据 producerId 获取 producer
   * @param data 
   * @returns 
   */
  async get(data: { producerId: string }) {
    // 查询数据库
    const producer = await MediaProducer
      .getRepository()
      .findOne({
        where: { id: data.producerId },
      });
    if (producer) {
      return producer;
    }
    throw new Error('Producer not found');
  }

  /**
   * 根据 producerId 暂停媒体流
   * @param data 
   * @returns 
   */
  async pause(data: { producerId: string }) {
    // 获取 producer
    const producer = await this.get(data);
    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: producer.transportId,
    });
    // 发起 http 访问 producer 服务器（转发） 
    await fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/producers/:producerId/pause',
      method: 'POST',
      data: { producerId: data.producerId },
    });
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
    const producer = await this.get(data);
    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: producer.transportId,
    });
    // 发起 http 访问 producer 服务器（转发） 
    await fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/producers/:producerId/resume',
      method: 'POST',
      data: { producerId: data.producerId },
    });
    // 返回空对象【FIX】
    return {};
  }
}
