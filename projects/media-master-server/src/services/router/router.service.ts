import { Injectable } from '@nestjs/common';
import { InjectRepository, getEntityManagerToken } from '@nestjs/typeorm';
import { types } from 'mediasoup';
import { fetchApi } from '@/shared/fetch'
import { constants } from '@/shared/constants';
import { MediaRouter } from '@/dao/router/media.router.do';
import { WorkerService } from '../worker/worker.service';
import { RoomService } from '../room/room.service';
import { EntityManager } from 'typeorm';

@Injectable()
export class RouterService {
  constructor(
    @InjectRepository(MediaRouter)
    private readonly mediaRouter: MediaRouter,
    private readonly workerService: WorkerService,
    private readonly roomService: RoomService,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * 获取或创建router
   * @param { { roomId: string } } data roomId: 房间id
   * @returns 
   */
  async getOrCreate(data: { roomId: string }) {
    const result = await this.getForRoom(data);
    if (result) {
      return result;
    }
    return this.createForRoom(data);
  }

  /**
   * 获取房间
   * @param { { roomId: string } } data roomId：房间id
   * @returns 
   */
  async getForRoom(data: { roomId: string }): Promise<{
    id: string;
    rtpCapabilities: types.RtpCapabilities;
  } | null> {

    // 从数据库查询router
    const router = await MediaRouter
      .createQueryBuilder('router')
      .leftJoinAndSelect('router.worker', 'worker')
      .where('router.roomId = :roomId', { roomId: data.roomId })
      .andWhere('worker.transportCount < worker.maxTransport')
      .getOne();
    
    // 如果有router
    if (router) {
      // 发起 http 访问 consumer 服务器，查询router
      const result = await fetchApi({
        host: router.worker.apiHost,
        port: router.worker.apiPort,
        path: '/routers/:routerId',
        method: 'GET',
        data: { routerId: router.id },
      });
      // 返回 router 信息
      return {
        ...result,
        id: router.id
      };
    }
    return null;
  }

  /**
   * 
   * @param { { roomId: string } } data roomId：房间id
   * @returns 
   */
  async createForRoom(data: { roomId: string }): Promise<{
    id: string;
    // rtpCapabilities: types.RtpCapabilities;
  }> {
    // 创建 worder service 实例，并调用实例方法 getFor 查询数据库是否存在 consumer worker
    const worker = await this.workerService.getFor(
      constants.CONSUMER
    );

    /**
     * 发送 POST 请求 consumer 服务器（转发）
     * @returns result
     *   {
     *     id: router.id,
     *     rtpCapabilities: router.rtpCapabilities,
     *   }
     */
    const result = await fetchApi({
      host: worker.apiHost,
      port: worker.apiPort,
      path: '/routers',
      method: 'POST',
      data: { pid: worker.pid },
    });
    
    // 创建 mediaRouter 实例存放数据
    const mediaRouter = new MediaRouter();
    mediaRouter.id = result.routerId;
    mediaRouter.workerId = worker.id;
    Object.assign(mediaRouter, data);
    
    try {
      /*
       存贮到数据库
 
       通过 this.entityManager 获取数据库管理者 manager，
       链式调用 getRepository 函数，并传入相关entiry实体类，
       链式调用 save 函数，将 mediaRouter 数据保存至数据库
       */
      await MediaRouter.getRepository().save(mediaRouter);
    } catch (e) {
      // violates foreign key constraint because room doesn't exist
      // 如果发生异常
      // 发起 http 访问 consumer 服务器，删除该 router 条目
      fetchApi({
        host: worker.apiHost,
        port: worker.apiPort,
        path: '/routers/:routerId',
        method: 'DELETE',
        data: {
          routerId: result.routerId
        },
      });
      throw new Error('Room not found');
    }
    
    return {
      ...result,
      id: result.routerId
    };
  }

  /**
   * 根据 routerId 获取 router
   * @param data routerId
   * @returns 
   */
  async get(data: { routerId: string }) {
    /*
       查询数据库
 
       通过 this.entityManager 获取数据库管理者 manager，
       链式调用 getRepository 函数，并传入相关entiry实体类，
       链式调用 findOne 函数，查询数据
       */
    const router = await MediaRouter.getRepository().findOne({
      relations: { worker: true },
      where: { id: data.routerId },
    });
    if (router) {
      return router;
    }
    throw new Error('Router not found');
  }

  /**
   * 
   * @param data 
   * @returns 
   */
  checkToPipe(data: { routerId: string; producerId: string }) {
    /*
     开启事务

     通过 this.entityManager 获取数据库管理者 manager，
     链式调用 transaction 函数，并传入回调
     */
    return this.entityManager.transaction(async (entityManager) => {
      console.log("%c Line:157 🥃 entityManager", "color:#4fff4B", entityManager);
      // 查处一个 router
      const router = await entityManager.getRepository(MediaRouter).findOne({
        lock: { mode: 'pessimistic_write' },
        where: { id: data.routerId },
      });

      if (router && !router.pipedProducers.includes(data.producerId)) {
        // 创建 room service 的实例，并传入 entityManager。通过实例调用get实例函数，获取到 room
        const room = await this.roomService.get({
          roomId: router.roomId,
        });
        // 创建 worker service 的实例，并传入 entityManager。通过实例调用get实例函数，获取到 worker
        const worker = await this.workerService.get({
          workerId: router.workerId,
        });

        // 发起 http 请求
        await fetchApi({
          host: worker.apiHost,
          port: worker.apiPort,
          path: '/routers/:routerId/destination_pipe_transports',
          method: 'POST',
          data: {
            routerId: data.routerId,
            sourceHost: room.worker.apiHost,
            sourcePort: room.worker.apiPort,
            sourceRouterId: room.routerId,
            sourceProducerId: data.producerId,
          },
        });

        // 将 producerId 缓存到 router.pipedProducers
        router.pipedProducers.push(data.producerId);

        // 使用 entityManager 保存 router 到数据库
        await entityManager.save(router);
      }
    });
  }
}
