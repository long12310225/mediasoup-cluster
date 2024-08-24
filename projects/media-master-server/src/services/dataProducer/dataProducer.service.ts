import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaRoom } from '@/dao/room/media.room.do';
import { types } from 'mediasoup';
import { constants } from '@/shared/constants';
import { fetchApi } from '@/shared/fetch';

import { TransportService } from '@/services/transport/transport.service';
import { MediaDataProducer } from '@/dao/dataProducer/media.dataProducer.do';

@Injectable()
export class DataProducerService {
  constructor(private readonly transportService: TransportService) {}

  /**
   * 创建 dataProducer
   * @param data
   * @returns
   */
  public async createProduceData(data: {
    transportId: string;
    label: string;
    protocol: string;
    sctpStreamParameters: any;
    appData: any;
    broadcasterId?: string
  }): Promise<any> {
    // 根据 transportId 查出数据库相关 transport
    const transport = await this.transportService.get({
      transportId: data.transportId,
    });

    // 如果类型是'producer'
    if (transport.type === constants.PRODUCER) {
      // 发起 http，返回 mediasoup dataProducer
      const result = await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/producer_data/:transportId/create',
        method: 'POST',
        data: {
          transportId: transport.id,
          label: data.label,
          protocol: data.protocol,
          sctpStreamParameters: data.sctpStreamParameters,
          appData: data.appData,
          broadcasterId: data?.broadcasterId
        },
      });

      if(!result) return

      // 创建 MediaProducer 实例
      const mediaDataProducer = new MediaDataProducer();
      mediaDataProducer.id = result.id;
      mediaDataProducer.label = result.label;
      mediaDataProducer.protocol = result.protocol;
      mediaDataProducer.transportId = transport.id;

      // 保存入库
      await MediaDataProducer.getRepository().save(mediaDataProducer);

      // 返回 mediasoup dataProducer
      return result;
    }
    console.error('Invalid transport');
    return;
  }

  /**
   * 根据 dataProducerId 获取 dataProducer
   * @param data
   * @returns
   */
  public async get(data: { dataProducerId: string }) {
    // 查询数据库
    const dataProducer = await MediaDataProducer.getRepository().findOne({
      where: { id: data.dataProducerId },
    });
    if (dataProducer) {
      return dataProducer;
    }
    console.error('dataProducer not found');
    return;
  }

  /**
   * 根据 dataProducerId 获取 dataProducer 状态
   * @param data
   * @returns
   */
  public async getStats(data: { dataProducerId: string }) {
    // 获取 dataProducer
    const dataProducer = await this.get(data);

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: dataProducer.transportId,
    });

    // 发起 http 访问 dataProducer 服务器（转发）
    const res = await fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/producer_data/:dataProducerId/getStats',
      method: 'POST',
      data: { dataProducerId: data.dataProducerId },
    });
    return res;
  }
}
