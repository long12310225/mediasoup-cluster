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
  // 缓存 router
  static mediarouters = new Map<string, any>();

  constructor(
    @InjectRepository(MediaRouter)
    private readonly mediaRouter: MediaRouter,
    private readonly workerService: WorkerService,
    private readonly roomService: RoomService,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * 获取或创建 media router
   * @param { { roomId: string } } data roomId: 房间主键id
   * @returns 
   */
  public async getOrCreate(data: {
    roomId: string;
  }) {
    // 注意：必须要从数据库中查询！！否则集群能力失效
    const result = await this.getForRoom({
      roomId: data.roomId
    });
    if (result) return result;
      
    const res = await this.createForRoom(data);
    console.log("%c Line:39 🍖 新建 router :", "color:#f5ce50", res);
    return res
  }

  public getRouter(data: { roomId: string }) {
    if (RouterService.mediarouters.has(data.roomId)) {
      const router = RouterService.mediarouters.get(data.roomId)
      console.log("%c Line:46 🍬 getRouter router", "color:#ea7e5c", router);
      return router
    }
    return null;
  }

  /**
   * 获取房间
   * @param { { roomId: string } } data roomId：房间主键id
   * @returns 
   */
  public async getForRoom(data: { roomId: string }): Promise<{
    id: string;
    rtpCapabilities: types.RtpCapabilities;
  } | null> {
    // 从数据库查询router
    const router = await MediaRouter
      .createQueryBuilder('router')
      .leftJoinAndSelect('router.worker', 'worker')
      .where('router.room_id = :roomId', { roomId: data.roomId })
      .andWhere('worker.transportCount < worker.maxTransport')
      .getOne();
    console.log("%c Line:63 🎂 查询 router：", "color:#fca650", router);
    
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

      if(!result) return

      // 返回 router 信息
      return {
        ...result,
        routerId: router.id
      };
    }
    return null;
  }

  /**
   * 创建 media router
   * @param { { roomId: string } } data roomId：房间主键id
   * @returns 
   */
  public async createForRoom(data: {
    roomId: string;
  }): Promise<{
    id: string;
  }> {
    // 创建 worder service 实例，并调用实例方法 getWorker 查询数据库是否存在 consumer worker
    const worker = await this.workerService.getWorker(
      constants.CONSUMER
    );

    // 发送 POST 请求 consumer 服务器（转发）
    const result = await fetchApi({
      host: worker.apiHost,
      port: worker.apiPort,
      path: '/routers',
      method: 'POST',
      data: { pid: worker.pid },
    });

    if(!result) return
    
    try {
      // 创建 mediaRouter 实例存放数据
      const mediaRouter = new MediaRouter();
      mediaRouter.id = result.routerId;
      mediaRouter.workerId = worker.id;
      mediaRouter.roomId = data.roomId;
      
      /*
       存贮到数据库
 
       通过 this.entityManager 获取数据库管理者 manager，
       链式调用 getRepository 函数，并传入相关entiry实体类，
       链式调用 save 函数，将 mediaRouter 数据保存至数据库
       */
      await MediaRouter.getRepository().save(mediaRouter);

      RouterService.mediarouters.set(data.roomId, mediaRouter);
    } catch (e) {
      if (RouterService.mediarouters.has(data.roomId)) {
        RouterService.mediarouters.delete(data.roomId);
      }

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
      console.error(e)
      console.error('Room not found');
      return;
    }
    
    return result
  }

  /**
   * 根据 routerId 获取 router
   * @param data routerId
   * @returns 
   */
  public async get(data: { routerId: string }) {
    /*
      查询数据库

      通过 this.entityManager 获取数据库管理者 manager，
      链式调用 getRepository 函数，并传入相关entiry实体类，
      链式调用 findOne 函数，查询数据
    */
    const router = await MediaRouter.getRepository().findOne({
      relations: { worker: true },
      where: {
        id: data.routerId
      },
    });
    if (router) {
      return router;
    }
    console.error('Router not found');
    return;
  }

  /**
   * 根据 roomId 获取 router
   * @param data routerId
   * @returns 
   */
  public async getRouterByRoomId(data: { roomId: string }) {
    const router = await MediaRouter.getRepository().findOne({
      relations: { worker: true },
      where: {
        roomId: data.roomId
      },
    });
    if (router) {
      return router;
    }
    console.error('Router not found');
    return;
  }

  /**
   * 根据 PeerId 获取 router
   * @param data peerId
   * @returns 
   */
  // public async getRouterByPeerId(data: { peerId: string }) {
  //   const router = await MediaRouter.getRepository().findOne({
  //     relations: { worker: true },
  //     where: { peerId: data.peerId },
  //   });
  //   console.log("%c Line:198 🍆🍆🍆🍆 router", "color:#ed9ec7", router);
  //   if (router) {
  //     return router;
  //   }
  //   console.error('Router not found');
  //   return;
  // }

  /**
   * 删除 consumer router
   * @param data peerId
   * @returns 
   */
  // public async deleteRouter(data: { peerId: string }): Promise<void> {
  //   const router = await this.getRouterByPeerId(data)

  //   if (!router) return
    
  //   // 如果有router，移除 consumer 服务的缓存
  //   // 发起 http 访问 consumer 服务器，查询router
  //   const result = await fetchApi({
  //     host: router.worker.apiHost,
  //     port: router.worker.apiPort,
  //     path: '/routers/:routerId',
  //     method: 'DELETE',
  //     data: { routerId: router.id },
  //   });
  //   console.log("%c Line:218 🥐 result = {}", "color:#ed9ec7", result);

  //   if (!result) throw new Error('删除 consumer router 失败')
    
  //   // 移除数据库 router
  //   await MediaRouter.getRepository().delete({
  //     peerId: data.peerId
  //   });
  // }

  /**
   * 检查管道
   * 
   * @param data 
   * @returns 
   */
  public checkToPipe(data: { routerId: string; producerId: string }) {
    /*
     开启事务

     通过 this.entityManager 获取数据库管理者 manager，
     链式调用 transaction 函数，并传入回调
     */
    return this.entityManager.transaction(async (entityManager) => {
      // 【查一】
      // 根据 routerId 查出一个 router
      // const router = await entityManager.getRepository(MediaRouter).findOne({
      //   lock: { mode: 'pessimistic_write' },
      //   where: { id: data.routerId },
      // });
      const router = await entityManager.getRepository(MediaRouter)
        .createQueryBuilder('mediaRouter')
        .setLock('pessimistic_write')
        .where('mediaRouter.id = :routerId', { routerId: data.routerId })
        .getOne();
      console.log("%c Line:284 =========== router", "color:#33a5ff", router);

      if (router && !router.pipedProducers.includes(data.producerId)) {
        // 【查二】
        // 通过 router.roomId 获取 room
        const room = await this.roomService.get({
          id: router.roomId,
        });
       
        // 【查三】
        // 通过 router.workerId 查到对应 worker(consumer)
        const worker = await this.workerService.get({
          workerId: router.workerId,
        });

        // 【请求一】
        /**
         * 向 consumer 服务发起 http 请求【当事务正常执行才会发起】
         * 多少个 producer 就发起多少次请求
         */
        await fetchApi({
          host: worker.apiHost,
          port: worker.apiPort,
          path: '/routers/:routerId/destination_pipe_transports',
          method: 'POST',
          data: {
            routerId: data.routerId, // 这是 consumer routerId
            sourceHost: room.worker.apiHost,
            sourcePort: room.worker.apiPort,
            sourceRouterId: room.routerId, // 这是 prucuder routerId
            sourceProducerId: data.producerId,
          },
        });

        // 将 producerId 缓存到 router.pipedProducers
        // router.pipedProducers.push(data.producerId);
        let pipedProducers
        if (router.pipedProducers) {
          pipedProducers = router.pipedProducers.split(',')
        } else {
          pipedProducers = []
        }
        pipedProducers.push(data.producerId);
        router.pipedProducers = pipedProducers.join(',')

        // 【保存一】
        // 使用 entityManager 保存 router 到数据库
        await entityManager.save(router);
      }
    });
  }

  /**
   * 检查管道
   * 
   * @param data 
   * @returns 
   */
  // public async checkToPipe(data: { routerId: string; producerId: string }) {

  //   // 根据 routerId 查出一个 router
  //   const router = await this.entityManager.getRepository(MediaRouter).findOne({
  //     where: { id: data.routerId },
  //     relations: {
  //       worker: true
  //     }
  //   });
  
  //   if (router && !router.pipedProducers.includes(data.producerId)) {
  //     // 通过 router.workerId 查到对应 worker(consumer)
  //     const worker = await this.workerService.get({
  //       workerId: router.workerId,
  //     });

  //     // 通过 router.roomId 获取 room
  //     const room = await this.roomService.get({
  //       id: router.roomId,
  //     });

  //     /**
  //      * 向 consumer 服务发起 http 请求【当事务正常执行才会发起】
  //      * 多少个 producer 就发起多少次请求
  //      */
  //     const res = await fetchApi({
  //       host: worker.apiHost, // consumer
  //       port: worker.apiPort, // consumer
  //       path: '/routers/:routerId/destination_pipe_transports',
  //       method: 'POST',
  //       data: {
  //         routerId: data.routerId, // 这是 consumer routerId
  //         sourceProducerId: data.producerId, // prucuder 待消费的 producerId
  //         sourceHost: room.worker.apiHost, // prucuder apiHost
  //         sourcePort: room.worker.apiPort, // prucuder apiPort
  //         sourceRouterId: room.routerId, // 这是 prucuder routerId
  //       },
  //     });

  //     // 将 producerId 缓存到 router.pipedProducers 数组中
  //     router.pipedProducers.push(data.producerId);

  //     // 使用 entityManager 保存 router 到数据库
  //     await this.entityManager.save(router);
  //   }
    
  // }

  /**
   * 检查管道
   * 
   * @param data 
   * @returns 
   */
  public checkDataProducerToPipe(data: { routerId: string; dataProducerId: string }) {
    // console.log("%c router.service.ts checkDataProducerToPipe() 开始处 data:", "color:#7f2b82", data);
    
    /*
     开启事务

     通过 this.entityManager 获取数据库管理者 manager，
     链式调用 transaction 函数，并传入回调
     */
    return this.entityManager.transaction(async (entityManager) => {
      // 从库中查出一个 router
      // const router = await entityManager.getRepository(MediaRouter).findOne({
      //   lock: { mode: 'pessimistic_write' },
      //   where: { id: data.routerId },
      // });
      const router = await entityManager.getRepository(MediaRouter)
        .createQueryBuilder('mediaRouter')
        .setLock('pessimistic_write')
        .where('mediaRouter.id = :routerId', { routerId: data.routerId })
        .getOne();
      // console.log("%c Line:255 🍡 router有roomId吗", "color:#e41a6a", router);

      if (router && !router.pipedDataProducers.includes(data.dataProducerId)) {
        // 创建 room service 的实例，并传入 entityManager。通过实例调用get实例函数，获取到 room
        const room = await this.roomService.get({
          id: router.roomId,
        });
        
        // 创建 worker service 的实例，并传入 entityManager。通过实例调用get实例函数，获取到 worker
        const worker = await this.workerService.get({
          workerId: router.workerId,
        });

        const params = {
          routerId: data.routerId,
          sourceHost: room.worker.apiHost,
          sourcePort: room.worker.apiPort,
          sourceRouterId: room.routerId,
          sourceDataProducerId: data.dataProducerId,
        }
        // console.log("%c router.service.ts 请求接口 /routers/:routerId/data_destination_pipe_transports 参数 🍷 worker, params", worker, params);
        // 发起 http 请求。触发 pipe_transport
        const res = await fetchApi({
          host: worker.apiHost,
          port: worker.apiPort,
          path: '/routers/:routerId/data_destination_pipe_transports',
          method: 'POST',
          data: params,
        });
        // console.log("%c Line:288 🍐 res", "color:#42b983", res);

        // 将 dataProducerId 缓存到 router.pipedDataProducers
        // router.pipedDataProducers.push(data.dataProducerId);
        const pipedDataProducers = router.pipedDataProducers.split(',')
        pipedDataProducers.push(data.dataProducerId);
        router.pipedDataProducers = pipedDataProducers.join()

        // 使用 entityManager 保存 router 到数据库
        await entityManager.save(router);
      }
    });
  }

  async getResource(data: { roomId: string }) {
    // 从数据库查询router
    const router = await MediaRouter
      .createQueryBuilder('router')
      .leftJoinAndSelect('router.worker', 'worker')
      .where('router.room_id = :roomId', { roomId: data.roomId })
      .andWhere('worker.transportCount < worker.maxTransport')
      .getOne();
    
    // 如果有router
    if (router) {
      // 发起 http 访问 consumer 服务器，查询router
      const result = await fetchApi({
        host: router.worker.apiHost,
        port: router.worker.apiPort,
        path: '/getrouters',
        method: 'GET',
        data: { roomId: data.roomId },
      });
    }
  }
}
