import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { RouterService } from '../router/router.service';
import { RoomService } from '../room/room.service';
import { fetchApi } from '@/shared/fetch'
import { MediaTransport } from '../../dao/transport/media.transport.do';
import { MediaWorker } from '../../dao/worker/media.worker.do';
import { constants } from '../../shared/constants';

@Injectable()
export class TransportService {
  constructor(
    private readonly routerService: RouterService,
    private readonly roomService: RoomService
  ) { }

  /**
   * 创建 producer
   * @param data 
   * @returns 
   */
  async createProducer(data: {
    roomId: string;
    userId?: string;
    metadata?: any;
  }): Promise<{
    id: string;
    iceParameters: types.IceParameters;
    iceCandidates: types.IceCandidate[];
    dtlsParameters: types.DtlsParameters;
  }> {
    // 根据 roomId 获取 room
    const room = await this.roomService.get({
      roomId: data.roomId,
    });

    // 发起 http 请求，访问 producer 服务器（转发）
    const result = await fetchApi({
      host: room.worker.apiHost,
      port: room.worker.apiPort,
      path: '/routers/:routerId/producer_transports',
      method: 'POST',
      data: { routerId: room.routerId },
    });

    // 创建 entity 实例
    const mediaTransport = new MediaTransport();
    mediaTransport.id = result.id;
    mediaTransport.routerId = room.routerId;
    mediaTransport.workerId = room.worker.id;
    mediaTransport.type = constants.PRODUCER;
    mediaTransport.roomId = room.id;
    mediaTransport.userId = data.userId;

    /*
     存贮到数据库

     通过 this.entityManager 获取数据库管理者 manager，
     链式调用 getRepository 函数，并传入相关entiry实体类，
     链式调用 save 函数，将 mediaTransport 数据保存至数据库
     */
    await MediaTransport.getRepository().save(mediaTransport);
    // 修改 media_worker 表数据
    MediaWorker.getRepository().increment({ id: room.workerId }, 'transportCount', 1);
    
    // 返回 producer 的数据
    return result;
  }

  /**
   * 创建 consumer
   * @param data 
   * @returns 
   */
  async createConsumer(data: { routerId: string; userId?: string }): Promise<any> {
    // 创建 router service 实例，并调用使用方法 get 查询数据库的 router
    const router = await this.routerService.get({
      routerId: data.routerId,
    })
    
    // 发起 http 访问
    const result = await fetchApi({
      host: router.worker.apiHost,
      port: router.worker.apiPort,
      path: '/routers/:routerId/consumer_transports',
      method: 'POST',
      data: { routerId: router.id },
    });

    // 创建 mediaTransport 实例存放数据
    const mediaTransport = new MediaTransport();
    mediaTransport.id = result.id;
    mediaTransport.routerId = router.id;
    mediaTransport.workerId = router.worker.id;
    mediaTransport.type = constants.CONSUMER;
    mediaTransport.roomId = router.roomId;
    mediaTransport.userId = data.userId;

    /*
      存贮到数据库
 
      通过 this.entityManager 获取数据库管理者 manager，
      链式调用 getRepository 函数，并传入相关entiry实体类，
      链式调用 save 函数，将 mediaTransport 数据保存至数据库
    */
    await MediaTransport.getRepository().save(mediaTransport);
    // 根据对应的 wordId 向该条目修改数据
    MediaWorker.getRepository().increment({ id: router.workerId }, 'transportCount', 1);
    
    // 返回 http 访问结果
    return result;
  }

  /**
   * 连接 producer
   * @param data 
   * @returns 
   */
  async connectProducer(data: { transportId: string; dtlsParameters: any }) {
    console.log("%c Line:120 🍫 data", "color:#2eafb0", data);
    // 从数据库找到对应 transport
    const transport = await this.get({ transportId: data.transportId });
    console.log("%c Line:122 🥃 transport", "color:#fca650", transport);
    // 是 producer 类型就转发
    if (transport.type === constants.PRODUCER) {
      const res = await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: `/producer_transports/:transportId/connect`,
        method: 'POST',
        data: {
          transportId: transport.id,
          dtlsParameters: data.dtlsParameters,
        },
      });
      console.log("%c Line:126 🥟 res", "color:#42b983", res);

      // 返回一个空对象【FIX】
      return {};
    }
    throw new Error('Invalid type transport');
  }

  /**
   * 根据 transportId 获取 transport
   * @param data 
   * @returns 
   */
  async get(data: { transportId: string }) {
    // 查找数据库
    const transport = await MediaTransport
      .getRepository()
      .findOne({
        relations: { worker: true },
        where: { id: data.transportId },
      });
    if (transport) {
      return transport;
    }
    throw new Error('Transport not found');
  }

  /**
   * 根据 roomId 从数据库中找到 producers
   * @param data 
   * @returns 
   */
  async getProducers(data: { roomId: string }): Promise<{
    items: Array<{
      id: string;
      userId: string;
      producers: Array<{ id: string; kind: string }>;
    }>;
  }> {
    // 从数据库查出 transport
    const items = (await MediaTransport.getRepository().find({
      relations: { producers: true },
      select: ['id', 'producers', 'userId'],
      where: {
        roomId: data.roomId,
        type: constants.PRODUCER,
      },
    })) as any;
    return { items };
  }

  /**
   * 关闭 MediaTransport
   * @param { MediaTransport } transport 
   */
  async closeTransport(transport: MediaTransport) {
    // 发送 http 请求，关闭 transport
    try {
      await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path:
          transport.type === constants.CONSUMER
            ? `/consumer_transports/:transportId`
            : `/producer_transports/:transportId`,
        method: 'DELETE',
        data: { transportId: transport.id },
      });
    } catch { }
    // 从数据库中，删除对应transport
    await MediaTransport
    .getRepository()
    .delete({ id: transport.id });
    // 从数据库中，操作 worker，记录 transportCount 为 1【TODO 作用是什么？】
    await MediaWorker
      .getRepository()
      .decrement({ id: transport.workerId }, 'transportCount', 1);
  }

  /**
   * 连接 consumer
   * @param data 
   * @returns 
   */
  async connectConsumer(data: { transportId: string; dtlsParameters: any }) {
    // 获取 transport
    const transport = await this.get({ transportId: data.transportId });
    // 如果类型是 'consumer'
    if (transport.type === constants.CONSUMER) {
      // 发起 http，发送 transportId，连接 transport
      await fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: `/consumer_transports/:transportId/connect`,
        method: 'POST',
        data: {
          transportId: transport.id,
          dtlsParameters: data.dtlsParameters,
        },
      });
      // 返回一个空对象【FIX】
      return {};
    }
    throw new Error('Invalid type transport');
  }

  // create consumer same host with producer
  async createSameHostConsumer(data: {
    roomId: string;
    userId?: string;
    metadata?: any;
  }): Promise<{
    id: string;
    iceParameters: types.IceParameters;
    iceCandidates: types.IceCandidate[];
    dtlsParameters: types.DtlsParameters;
  }> {
    const room = await this.roomService.get({
      roomId: data.roomId,
    });
    const result = await fetchApi({
      host: room.worker.apiHost,
      port: room.worker.apiPort,
      path: '/routers/:routerId/consumer_transports',
      method: 'POST',
      data: { routerId: room.routerId },
    });
    const mediaTransport = new MediaTransport();
    mediaTransport.id = result.id;
    mediaTransport.routerId = room.routerId;
    mediaTransport.workerId = room.worker.id;
    mediaTransport.type = constants.CONSUMER;
    mediaTransport.roomId = room.id;
    mediaTransport.userId = data.userId;

    await MediaTransport.getRepository().save(mediaTransport);
    MediaWorker.getRepository().increment({ id: room.workerId }, 'transportCount', 1);
    return result;
  }

  async close(data: { transportId: string }) {
    const transport = await this.get(data);
    await this.closeTransport(transport);
    return {};
  }
}
