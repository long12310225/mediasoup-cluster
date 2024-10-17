import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaRoom } from '@/dao/room/media.room.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaTransport } from '@/dao/transport/media.transport.do';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { types } from 'mediasoup';
import { CONSTANTS } from '@/common/enum';
import { WorkerService } from '../worker/worker.service';
import { Room as ProtooRoom } from '@/common/libs/protoo-server';
import { RoomDto, BroadcasterDto } from '@/dto';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class RoomService {
  // 缓存 protooRooms
  static protooRooms = new Map<string, any>();
  static routerList = new Map<string, any>();

  constructor(
    @InjectPinoLogger(RoomService.name)
    private readonly logger: PinoLogger,
    private readonly workerService: WorkerService,
    private readonly axiosService: AxiosService
  ) { }

  /**
   * 创建房间
   * @param { RoomDto }data 接收客户端传递的数据
   * @returns
   */
  public async create(data: RoomDto): Promise<any> {
    const { roomId } = data
    // 创建 worder service 实例，并调用实例方法 getWorker 查询数据库是否存在 producer worker
    const worker = await this.workerService.getWorker(
      CONSTANTS.PRODUCER
    );
    if(!worker) return

    /**
     * 发送 POST 请求 producer 服务器（转发）
     * @returns router
     *   {
     *     id: router.id,
     *     rtpCapabilities: router.rtpCapabilities,
     *   }
     */
    const result = await this.axiosService.fetchApi({
      host: worker.apiHost,
      port: worker.apiPort,
      path: '/routers/create',
      method: 'POST',
      data: { pid: worker.pid },
    });

    if(!result) return

    // 创建 mediaRoom 实例存放数据
    const mediaRoom: any = new MediaRoom();
    mediaRoom.workerId = worker.id;
    mediaRoom.routerId = result.routerId;
    mediaRoom.roomId = roomId;
    Object.assign(mediaRoom, data);

    await MediaRoom.getRepository().save(mediaRoom);

    return {
      // ...result, // 没用
      id: mediaRoom.id, // typeorm 自身的 uuid 自动生成的 room id
      roomId: mediaRoom.roomId // 房间 id
    };
  }

  /**
   * 创建或获取 producer 房间
   * @param { RoomDto } data 接收客户端传递的数据
   * @returns
   */
  public async createOrGetProducerRoom(data: RoomDto): Promise<any> {
    const protoRoom = this.getProtooRoom(data.roomId)

    if (protoRoom) {
      this.logger.info("有房间");
      return {
        ...protoRoom.mediaRoom,
        serverType: CONSTANTS.CONSUMER
      }
    } else {
      this.logger.info("没有房间");
      const newRoom = await this.createProducerRoom(data)
      return {
        ...newRoom,
        serverType: CONSTANTS.PRODUCER
      }
    }
  }

  /**
   * 创建 producer 房间
   * @param { RoomDto } data 接收客户端传递的数据
   * @returns
   */
  public async createProducerRoom({ roomId }: RoomDto): Promise<any> {
    
    // 创建 worder service 实例，并调用实例方法 getWorker 查询数据库是否存在 producer worker
    const worker = await this.workerService.getWorker(
      CONSTANTS.PRODUCER
    );
    if(!worker) return

    /**
     * 发送 POST 请求 producer 服务器（转发）
     * @returns { {
     *    roomId: data.roomId,
     *    routerId: mediasoupRouter.id
     * } } result
     */
    const result = await this.axiosService.fetchApi({
      host: worker.apiHost,
      port: worker.apiPort,
      path: '/room/create',
      method: 'POST',
      data: {
        pid: worker.pid,
        roomId
      },
    });

    if(!result) return

    // 创建 mediaRoom 实例存放数据
    const mediaRoom: any = new MediaRoom();
    mediaRoom.roomId = roomId;
    mediaRoom.workerId = worker.id;
    mediaRoom.routerId = result.routerId;
    await MediaRoom.getRepository().save(mediaRoom);

    // 创建 protooRoom
    const protooRoom = new ProtooRoom({
      roomId,
      mediaRoom
    });
    RoomService.protooRooms.set(roomId, protooRoom);

    // 创建时，只能返回 mediaRoom。因为下一步还需要 room 主键id 来创建 consumer router
    return mediaRoom
  }

  /**
   * 根据 room 主键id 查询房间
   * @param { { id: string } } data
   * @returns 
   */
  public async get(data: { id: string }): Promise<MediaRoom> {
    // 从数据库中查询房间
    const roomData: MediaRoom = await MediaRoom.getRepository().findOne({
      relations: { worker: true },
      where: { id: data.id },
    });
    if (!roomData) {
      this.logger.warn(`media_room表中没有 ${data.id} 这条数据`);
      return
    }
    return roomData;
  }

  /**
   * 根据 room id 查询 room
   * @param { RoomDto } 
   * @returns
   */
  public async getRoom(data: RoomDto) {
    try {
      // 从数据库中查询房间
      const roomData: MediaRoom = await MediaRoom.getRepository().findOne({
        relations: {
          worker: true,
          routers: true
        },
        where: {
          roomId: data.roomId
        },
      });
      if (!roomData) {
        this.logger.warn(`media_room表中没有 ${data.roomId} 这条数据`);
        return;
      }
      return roomData;
    } catch (error) {
      this.logger.error(error)
      return null
    }
  }

  /**
   * 根据 roomId 查询 protooRoom
   * @param { string } roomId room id
   * @returns
   */
  public getProtooRoom(roomId: string) {
    const protooRoom = RoomService.protooRooms.get(roomId);
    if (protooRoom) {
      return protooRoom
    }
    return
  }
  
  /**
   * 查询房间列表
   */
  async getList({
    page = 1,
    pageSize = 30,
    orderBy = '-createDate',
  }: {
    pageSize?: number;
    page?: number;
    orderBy?: string;
    }) {
    // 查询数据库并汇总数量
    const [items, total] = await MediaRoom
      .getRepository()
      .findAndCount({
        take: Math.max(pageSize, 100),
        skip: (page - 1) * pageSize,
        order: { [orderBy.slice(1)]: orderBy[0] === '-' ? 'DESC' : 'ASC' },
      });
    return {
      items,
      pagination: { page, pageSize, total },
    };
  }

  /**
   * 获取 rtpCapabilities
   * @param { RoomDto } data 
   * @returns 
   */
  public async getCapabilities(data: RoomDto): Promise<{
    id: string;
    rtpCapabilities: types.RtpCapabilities;
  }> {
    // 根据 roomId 查询某个房间
    const room = await this.getRoom(data);
    if(!room) return

    // 发起 http 获取 rtpCapabilities（根据 routerId 查询 rtpCapabilities）
    const result = await this.axiosService.fetchApi({
      host: room.worker.apiHost,
      port: room.worker.apiPort,
      path: '/routers/:routerId',
      method: 'GET',
      data: { routerId: room.routerId },
    });

    if(!result) return
    
    // 返回 rtpCapabilities
    return {
      ...result.rtpCapabilities,
      // id: data.roomId
    };
  }

  /**
   * 根据 roomId 删除房间
   *   1. 获取对应的worker，让http指向多个服务器（有producer、consumer）
   *   2. 关闭服务的router后，删除对应数据表的router
   * @param data 
   * @returns 
   */
  public async close(data: RoomDto) {
    try {
      // 根据 roomId 查询房间
      const room = await this.getRoom(data);
      this.logger.info('根据 roomId 删除房间 ------------')

      if (!room) return
      
      // 关闭房间所有 router（consumer）
      await this.closeConsumerRouters({
        roomId: room.id
      });

      // 关闭 router（producer）
      await this.closeRouter({
        routerId: room.routerId,
        worker: room.worker
      });

      // 删除缓存的 protooRoom
      RoomService.protooRooms.delete(data.roomId);

      // 删除数据库中的 room
      await MediaRoom.getRepository().delete({ id: room.id });

      // 返回空对象
      return {};
    } catch (error) {
      this.logger.error(error)
    }
  }

  /**
   * 关闭房间中所有 consumer 的 router
   */
  private async closeConsumerRouters(data: RoomDto) {
    // 查询数据库取出相同 roomId 中的 routers
    const routers = await MediaRouter.getRepository().find({
      relations: { worker: true }, // 关联 worker
      where: { roomId: data.roomId },
    });
    if (!routers || !routers.length) return;

    // 异步关闭 router（房间）
    await Promise.all(
      routers.map((router) => {
        RoomService.routerList.delete(router.id) // 移除缓存

        this.closeRouter({
          routerId: router.id,
          worker: router.worker
        })
      })
    );
    return {};
  }

  /**
   * 关闭 router
   * @param { { 
   *   routerId: string;
   *   worker: MediaWorker; 
   * } }
   */
  private async closeRouter(data: {
    routerId: string;
    worker: MediaWorker
  }) {
    // 发起 http 请求。根据 routerId 删除 router
    try {
      await this.axiosService.fetchApi({
        host: data.worker.apiHost,
        port: data.worker.apiPort,
        path: '/routers/:routerId',
        method: 'DELETE',
        data: { routerId: data.routerId },
      });
    } catch (error) {
      this.logger.error(error);
    }

    // 查询数据库，相同 routerId 的 MediaTransport 的数据条数
    const count = await MediaTransport
      .getRepository()
      .count({
        where: {
          routerId: data.routerId
        }
      });

    // 如果大于0
    if (count > 0) {
      // MediaWorker 表中的 transportCount - count
      await MediaWorker
        .getRepository()
        .decrement({ id: data.worker.id }, 'transportCount', count);
    }

    // 从数据库中删除 MediaRouter
    await MediaRouter
      .getRepository()
      .delete({
        id: data.routerId
      });
  }

  /**
   * 获取资源使用情况
   */
  async getResource(data: RoomDto) {
    try {
      // 根据 roomId 查询某个房间
      const room = await this.getRoom(data);
      if(!room) return

      const result = await this.axiosService.fetchApi({
        host: room.worker.apiHost,
        port: room.worker.apiPort,
        path: '/getrouters',
        method: 'GET',
        data: { roomId: data.roomId },
      });

    } catch (error) {
      this.logger.error(error)
    }
  }

  /**
   * 删除表中某条数据
   * @param data roomId: 房间id
   * @returns 
   */
  public async deleteRoom(data: RoomDto) {
    try {
      const room = await this.getRoom(data);
      if (!room) {
        return {
          msg: '没有该条数据'
        }
      } 
      const res = await MediaRoom.getRepository().delete({
        roomId: data.roomId
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
