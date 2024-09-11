import { Injectable } from '@nestjs/common';
import { InjectRepository, getEntityManagerToken } from '@nestjs/typeorm';
import { types } from 'mediasoup';
import { CONSTANTS } from '@/common/enum';
import { MediaRouter } from '@/dao/router/media.router.do';
import { WorkerService } from '../worker/worker.service';
import { RoomService } from '../room/room.service';
import { EntityManager } from 'typeorm';
import { RedisService } from 'nestjs-redis';
import { REDIS_TABLES } from '@/common/enum';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { RoomDto } from '@/dto';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class RouterService {
  private redis;
  // static producerList = new Map<string, any>();

  constructor(
    @InjectPinoLogger(RouterService.name)
    private readonly logger: PinoLogger,
    private readonly workerService: WorkerService,
    private readonly roomService: RoomService,
    private readonly entityManager: EntityManager,
    private readonly redisService: RedisService,
    private readonly axiosService: AxiosService
  ) {
    this.redis = this.redisService.getClient();
  }

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
    // console.log("%c Line:39 🍖 新建 router :", "color:#f5ce50", res);
    return res
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
      .andWhere('worker.is_alive_serve = :isAliveServe', { isAliveServe: 1 })
      .getOne();
    // console.log("%c Line:63 🎂 查询 router：", "color:#fca650", router);
    
    // 如果有router
    if (router) {
      // 发起 http 访问 consumer 服务器，查询router
      const result = await this.axiosService.fetchApi({
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
      CONSTANTS.CONSUMER
    );

    if(!worker) return

    // 发送 POST 请求 consumer 服务器（转发）
    const result = await this.axiosService.fetchApi({
      host: worker.apiHost,
      port: worker.apiPort,
      path: '/routers/create',
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

      RoomService.routerList.set(mediaRouter.id, {
        ...mediaRouter,
        pipedProducers: []
      })
      
      /*
       存贮到数据库
 
       通过 this.entityManager 获取数据库管理者 manager，
       链式调用 getRepository 函数，并传入相关entiry实体类，
       链式调用 save 函数，将 mediaRouter 数据保存至数据库
       */
      await MediaRouter.getRepository().save(mediaRouter);

      // 【替换sql】
      this.redis.saveOne(REDIS_TABLES.MEDIA_ROUTER, mediaRouter)

    } catch (e) {
      // violates foreign key constraint because room doesn't exist
      // 如果发生异常
      // 发起 http 访问 consumer 服务器，删除该 router 条目
      this.axiosService.fetchApi({
        host: worker.apiHost,
        port: worker.apiPort,
        path: '/routers/:routerId',
        method: 'DELETE',
        data: {
          routerId: result.routerId
        },
      });
      this.logger.error(e);
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
    if (!router) {
      this.logger.error('router not found');
      return;
    }
    return router;
  }

  /**
   * 根据 roomId 获取 router
   * @param { RoomDto } data roomId
   * @returns 
   */
  public async getRouterByRoomId(data: RoomDto) {
    const router = await MediaRouter.getRepository().findOne({
      relations: { worker: true },
      where: {
        roomId: data.roomId
      },
    });
    if (!router) {
      this.logger.error('router not found');
      return;
    }
    return router;
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
  //   const result = await this.axiosService.fetchApi({
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
   * 检查管道【事务处理方式】
   * 
   * @param data 
   * @returns 
   */
  // public async checkToPipe(data: {
  //   routerId: string;
  //   producerId: string;
  // }): Promise<any> {
  //   /*
  //    开启事务

  //    通过 this.entityManager 获取数据库管理者 manager，
  //    链式调用 transaction 函数，并传入回调
  //    */
  //   try {
  //     return await this.entityManager.transaction(async (entityManager) => {
  //       // 根据 routerId 查出一个 router
  //       // const router = await entityManager.getRepository(MediaRouter).findOne({
  //       //   lock: { mode: 'pessimistic_write' },
  //       //   where: { id: data.routerId },
  //       // });
  //       // 调用多少遍，也会查询多少遍
  //       // console.log("%c Line:284 =========== transaction start", "color:#33a5ff");
  //       const router = await entityManager.getRepository(MediaRouter)
  //         .createQueryBuilder('mediaRouter')
  //         .setLock('pessimistic_write')
  //         .leftJoinAndSelect('mediaRouter.worker', 'worker')
  //         .where('mediaRouter.id = :routerId', { routerId: data.routerId })
  //         .getOne();
  //       // console.log("%c Line:284 =========== router", "color:#33a5ff", router);
        
  //       if (router && !router.pipedProducers.includes(data.producerId)) {
  //         // 通过 router.roomId 获取 room
  //         const room = await this.roomService.get({
  //           id: router.roomId,
  //         });
  
  //         /**
  //          * 向 consumer 服务发起 http 请求【当事务正常执行才会发起】
  //          * 多少个 producer 就发起多少次请求
  //          */
  //         await this.axiosService.fetchApi({
  //           host: router.worker.apiHost, // consumer
  //           port: router.worker.apiPort, // consumer
  //           path: '/routers/:routerId/destination_pipe_transports',
  //           method: 'POST',
  //           data: {
  //             routerId: data.routerId, // 这是 consumer routerId
  //             sourceProducerId: data.producerId, // prucuder 待消费的 producerId
  //             sourceHost: room.worker.apiHost, // prucuder apiHost
  //             sourcePort: room.worker.apiPort, // prucuder apiPort
  //             sourceRouterId: room.routerId, // 这是 prucuder routerId
  //           },
  //         });
  
  //         // 将 producerId 缓存到 router.pipedProducers
  //         // router.pipedProducers.push(data.producerId);
  //         let pipedProducers
  //         if (router.pipedProducers) {
  //           pipedProducers = router.pipedProducers.split(',')
  //         } else {
  //           pipedProducers = []
  //         }
  //         pipedProducers.push(data.producerId);
  //         router.pipedProducers = pipedProducers.join(',')
  
  //         // 使用 entityManager 保存 router 到数据库
  //         await entityManager.save(router);
  //       }
  //     });
  //   } catch (error) {
  //     console.error('checkToPipe error =>', error)
  //   }
  // }


  /**
   * 检查管道
   * 
   * @param data 
   * @returns 
   */
  public async checkToPipe(data: {
    routerId: string;
    producerId: string;
  }) {
    const lockKey = `lock_${data.routerId}`
    const lockValue = 'isLock'
    const isLock = await this.redis.lock(lockKey, lockValue, 10)
    if (isLock) {
      // 根据 routerId 查出一个 router
      const router = await this.redis.findOne(REDIS_TABLES.MEDIA_ROUTER, data.routerId)
      // console.log("%c Line:340 🌰 router", "color:#ed9ec7", router);
    
      if (router && !router.pipedProducers.includes(data.producerId)) {
        console.log("%c Line:345 🥓🥓 !router.pipedProducers.includes(data.producerId)", "color:#6ec1c2", data.producerId);

        // 通过 router.roomId 获取 room
        const room = await this.roomService.get({
          id: router.roomId,
        });

        const worker = await this.workerService.get({
          workerId: router.workerId,
        });

        if(!room || !worker) return
      
        /**
         * 向 consumer 服务发起 http 请求【当事务正常执行才会发起】
         * 多少个 producer 就发起多少次请求
         */
        const res = await this.axiosService.fetchApi({
          host: worker.apiHost, // consumer
          port: worker.apiPort, // consumer
          path: '/routers/:routerId/destination_pipe_transports',
          method: 'POST',
          data: {
            routerId: data.routerId, // 这是 consumer routerId
            sourceProducerId: data.producerId, // prucuder 待消费的 producerId
            sourceHost: room.worker.apiHost, // prucuder apiHost
            sourcePort: room.worker.apiPort, // prucuder apiPort
            sourceRouterId: room.routerId, // 这是 prucuder routerId
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

        await this.redis.saveOne(REDIS_TABLES.MEDIA_ROUTER, router)

        this.redis.unlock(lockKey, lockValue)
      }
    }
  }
 
  /**
   * 检查管道
   * 
   * @param data 
   * @returns 
   */
  // public async checkToPipe(data: {
  //   routerId: string;
  //   producerId: string;
  // }) {
  //   console.log("%c Line:340 🍺 checkToPipe", "color:#f5ce50");
    
  //   // 根据 routerId 查出一个 router
  //   const router = await MediaRouter.getRepository().findOne({
  //     where: {
  //       id: data.routerId
  //     }
  //   });
  
  //   // if (router && !router.pipedProducers.includes(data.producerId)) {
  //   // if (router && !RouterService.producerList.has(`${data.routerId}_${data.producerId}`)) {
  //   if (router && !RoomService.routerList.get(data.routerId)?.pipedProducers.includes(data.producerId)) {
  //     // console.log("%c Line:283 🍞 !router.pipedProducers.includes(data.producerId) ==> data.producerId: ", "color:#ea7e5c", data.producerId);
  //     console.log("%c Line:345 🥓 !RoomService.routerList.get(data.routerId)?.pipedProducers.includes(data.producerId)", "color:#6ec1c2", data.producerId);
  //     // RouterService.producerList.set(`${data.routerId}_${data.producerId}`, data)
  //     RoomService.routerList.get(data.routerId)?.pipedProducers.push(data.producerId)

  //     // 通过 router.roomId 获取 room
  //     const room = await this.roomService.get({
  //       id: router.roomId,
  //     });

  //     const worker = await this.workerService.get({
  //       workerId: router.workerId,
  //     });
      
  //     /**
  //      * 向 consumer 服务发起 http 请求【当事务正常执行才会发起】
  //      * 多少个 producer 就发起多少次请求
  //      */
  //     const res = await this.axiosService.fetchApi({
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

  //     // 将 producerId 缓存到 router.pipedProducers
  //     // router.pipedProducers.push(data.producerId);
  //     let pipedProducers
  //     if (router.pipedProducers) {
  //       pipedProducers = router.pipedProducers.split(',')
  //     } else {
  //       pipedProducers = []
  //     }
  //     pipedProducers.push(data.producerId);
  //     router.pipedProducers = pipedProducers.join(',')

  //     // 使用 entityManager 保存 router 到数据库
  //     await MediaRouter.getRepository().save(router);
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

        if(!room || !worker) return

        const params = {
          routerId: data.routerId,
          sourceHost: room.worker.apiHost,
          sourcePort: room.worker.apiPort,
          sourceRouterId: room.routerId,
          sourceDataProducerId: data.dataProducerId,
        }
        // console.log("%c router.service.ts 请求接口 /routers/:routerId/data_destination_pipe_transports 参数 🍷 worker, params", worker, params);
        // 发起 http 请求。触发 pipe_transport
        const res = await this.axiosService.fetchApi({
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
      const result = await this.axiosService.fetchApi({
        host: router.worker.apiHost,
        port: router.worker.apiPort,
        path: '/getrouters',
        method: 'GET',
        data: { roomId: data.roomId },
      });
    }
  }
}
