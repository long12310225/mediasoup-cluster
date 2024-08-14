import { Injectable } from '@nestjs/common';
import { constants } from '@/shared/constants';
import { fetchApi } from '@/shared/fetch';

import { TransportService } from '../transport/transport.service';
import { RouterService } from '../router/router.service';
import { MediaDataConsumer } from '@/dao/dataConsumer/media.dataConsumer.do';

@Injectable()
export class DataConsumerService {
  constructor(
    private readonly transportService: TransportService,
    private readonly routerService: RouterService,
  ) {}

  /**
   * 创建 dataConsumer
   * @param data
   * @returns
   */
  public async createConsumeData(data: {
    dataProducerId: string;
    transportId: string;
    peerId: string;
  }) {
    // console.log("%c dataConsumer.service.ts createConsumeData() 开始处 data:", "color:#4fff4B", data);

    // 从数据库中获取 stransport 关联的 worker
    const transport = await this.transportService.get({
      transportId: data.transportId,
    });
    // console.log("%c Line:28 🍤 createConsumeData | transport", "color:#3f7cff", transport);
    
    // 如果类型是'consumer'
    if (transport.type === constants.CONSUMER) {
      
      // 创建 router service，并调用实例方法 checkToPipe
      await this.routerService.checkDataProducerToPipe({
        routerId: transport.routerId,
        dataProducerId: data.dataProducerId,
      });

      // console.log("%c Line:32 🍤 createConsumeData | 执行接口 '/consumer_data/:transportId/create'", "color:#465975");
      // 发起 http。创建 mediasoup dataConsumer
      const result = await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumer_data/:transportId/create',
        method: 'POST',
        data: {
          transportId: transport.id,
          dataProducerId: data.dataProducerId,
          peerId: data.peerId,
        },
      });
      // console.log("dataConsumer.service.ts createConsumeData() 执行接口 /consumer_data/:transportId/create: 结果result", result);
      
      if(!result) return
      
      // 创建 MediaDataConsumer 实例，存入数据库
      const dataConsumer = new MediaDataConsumer();
      dataConsumer.id = result.id;
      dataConsumer.dataProducerId = data.dataProducerId;
      dataConsumer.label = result.label;
      dataConsumer.protocol = result.protocol;
      dataConsumer.transportId = transport.id;

      // 保存 MediaDataConsumer 实例到数据库
      await MediaDataConsumer.getRepository().save(dataConsumer);

      // 返回 mediasoup dataConsumer
      return result;
    }
    console.error('Invalid transport');
    return
  }

  /**
   * 根据 dataConsumerId 获取 dataConsumer
   * @param data dataConsumerId
   * @returns
   */
  public async get(data: { dataConsumerId: string }) {
    // 查询数据库获取 dataConsumer
    const dataConsumer = await MediaDataConsumer.getRepository().findOne({
      where: { id: data.dataConsumerId },
    });
    if (dataConsumer) {
      return dataConsumer;
    }
    console.error('dataConsumer not found');
    return
  }

  /**
   * 根据 dataConsumerId 获取 dataConsumer 状态
   * @param data
   * @returns
   */
  public async getStats({ dataConsumerId }: { dataConsumerId: string }) {
    // 获取 dataConsumer
    const dataConsumer = await this.get({ dataConsumerId });

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: dataConsumer.transportId,
    });

    // 发起 http 访问 consumer 服务器（转发）
    const res = await fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/consumers/:dataConsumerId/getStats',
      method: 'POST',
      data: {
        dataConsumerId,
      },
    });
    return res;
  }

  /**
   * 根据 dataConsumerId 暂停媒体流
   * @param data 
   * @returns 
   */
  public async pause(data: { dataConsumerId: string }) {
    // 查询 dataConsumer
    const dataConsumer = await this.get(data);

    // 创建 transport service 实例，并调用实例方法 get，通过 transportId 获取 transport
    const transport = await this.transportService.get({
      transportId: dataConsumer.transportId,
    });

    // 发起 http
    const res = await fetchApi({
      host: transport.worker.apiHost,
      port: transport.worker.apiPort,
      path: '/consumer_data/:dataConsumerId/pause',
      method: 'POST',
      data: { dataConsumerId: data.dataConsumerId },
    });
    // console.log("%c Line:132 🍉 res", "color:#2eafb0", res);
    // 返回空对象
    return {};
  }

  /**
   * 通过 dataConsumerId 重新开始
   * @param data
   * @returns
   */
  public async resume(data: { dataConsumerId: string }) {
    // console.log("%c dataConsumer.service.ts resume data", "color:#465975", data);

    // 获取 dataConsumer
    const dataConsumer = await this.get(data);

    // 创建 transport service 实例，并调用实例方法 get，获取 transport
    const transport = await this.transportService.get({
      transportId: dataConsumer.transportId,
    });
    
    // 如果类型是 consumer
    if (transport.type === constants.CONSUMER) {
      // 发起 http
      const res = await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: '/consumer_data/:dataConsumerId/resume',
        method: 'POST',
        data: {
          dataConsumerId: dataConsumer.id
        },
      });
      // console.log("%c Line:184 🍒 res", "color:#ea7e5c", res);
      // 返回空对象
      return {};
    }
    console.error('Invalid transport');
    return
  }
}
