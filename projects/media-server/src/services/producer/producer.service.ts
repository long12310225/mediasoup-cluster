import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaRoom } from '@/dao/room/media.room.do';
import { types } from 'mediasoup';
import { CONSTANTS } from '@/common/enum';

import { TransportService } from '@/services/transport/transport.service';
import { MediaProducer } from '@/dao/producer/media.producer.do';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { CreateProducerDo } from '@/dto';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class ProducerService {
  constructor(
    @InjectPinoLogger(ProducerService.name)
    private readonly logger: PinoLogger,
    private readonly transportService: TransportService,
    private readonly axiosService: AxiosService
  ) { }

  /**
   * 创建 producer
   * @param data 
   * @returns 
   */
  public async create(data: CreateProducerDo): Promise<any> {
    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: data.transportId,
    });

    // 如果类型是 producer
    if (transport?.type === CONSTANTS.PRODUCER) {
      // 发起 http 转发到 producer 服务中，创建 producer
      const result = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/producers/:transportId/producer',
        method: 'POST',
        data: {
          transportId: transport.id,
          kind: data.kind,
          rtpParameters: data.rtpParameters,
          appData: data?.appData,
          peerId: data?.peerId
        },
      });

      if (!result) return

      // 创建 MediaProducer 实例
      const producer = new MediaProducer();
      producer.id = result.id;
      producer.kind = data.kind;
      producer.transportId = transport.id;
      producer.peerId = data.peerId

      // 保存入库
      await MediaProducer.getRepository().save(producer);

      // 返回 producer
      return result;
    }

    this.logger.error('transport 类型不对，请检查')
    return
  }

  /**
   * 根据 producerId 获取 producer
   * @param data 
   * @returns 
   */
  public async get(data: { producerId: string }) {
    // 查询数据库
    const producer = await MediaProducer
      .getRepository()
      .findOne({
        where: { id: data.producerId },
      });
    if (!producer) {
      this.logger.warn(`media_producer表中没有 ${data.producerId} 这条数据`);
      return
    }
    return producer;
  }

  /**
   * 根据 producerId 暂停媒体流
   * @param data 
   * @returns 
   */
  public async pause(data: { producerId: string }) {
    // 获取 producer
    const producer = await this.get(data);
    if(!producer) return

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: producer.transportId,
    });
    if(!transport) return

    // 发起 http 访问 producer 服务器（转发） 
    await this.axiosService.fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/producers/:producerId/pause',
      method: 'POST',
      data: { producerId: data.producerId },
    });
    // 返回空对象
    return {};
  }

  /**
   * 根据 producerId 获取 producer 状态
   * @param data 
   * @returns 
   */
  public async getStats(data: { producerId: string }) {
    // 获取 producer
    const producer = await this.get(data);
    if(!producer) return

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: producer.transportId,
    });
    if(!transport) return

    // 发起 http 访问 producer 服务器（转发） 
    const res = await this.axiosService.fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/producers/:producerId/getStats',
      method: 'POST',
      data: { producerId: data.producerId },
    });
    return res;
  }

  /**
   * 根据 producerId 重连媒体流
   * @param data 
   * @returns 
   */
  public async resume(data: { producerId: string }) {
    // 获取 producer
    const producer = await this.get(data);
    if(!producer) return
    
    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: producer.transportId,
    });
    if (!transport) return
    
    // 发起 http 访问 producer 服务器（转发） 
    await this.axiosService.fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/producers/:producerId/resume',
      method: 'POST',
      data: { producerId: data.producerId },
    });
    // 返回空对象
    return {};
  }

  /**
   * 关闭 producer
   * @param data 
   */
  public async closeProducer(data: { producerId: string }) {
    // 获取 producer
    const producer = await this.get(data);
    if(!producer) return

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: producer.transportId,
    });
    if (!transport) return

    // 发起 http 访问 producer 服务器（转发） 
    const res = await this.axiosService.fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/producers/:producerId/close',
      method: 'POST',
      data: {
        producerId: data.producerId
      }
    }); 
    if (res) {
      // 移除数据库数据
      await this.deleteProducer({
        producerId: data.producerId
      });
      return res;
    }
    return;
  }

  /**
   * 删除数据表条目
   */
  public async deleteProducer(data: { producerId: string }) {
    try {
      // 获取 producer
      const producer = await this.get(data);
      if (!producer) return;
      const res = await MediaProducer.getRepository().delete({
        id: data.producerId
      });
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
