import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaRoom } from '@/dao/room/media.room.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaTransport } from '@/dao/transport/media.transport.do';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { types } from 'mediasoup';
import { constants } from '@/shared/constants';
import { WorkerService } from '../worker/worker.service';
import { MediaRouterService } from '../media.router/media.router.service';
import { fetchApi } from '@/shared/fetch'
import { v4 as uuidv4 } from 'uuid';

import * as url from 'url';
import { AwaitQueue } from 'awaitqueue';
import Room from '@/shared/ws/Room';
import Bot from '@/shared/ws/Bot';
import env from '@/config/env';

@Injectable()
export class RoomService {
  // 缓存 rooms
  static rooms = new Map<string, any>();

  constructor(
    @InjectRepository(MediaRoom)
    private readonly mediaRoomDo: MediaRoom,
    private readonly workerService: WorkerService,
  ) {}

  /**
   * 创建房间
   * @param { { metadata?: any } }data 接收客户端传递的数据
   * @returns
   */
  public static async create(data: any): Promise<any> {
    const { roomId } = data
    // 创建 worder service 实例，并调用实例方法 getFor 查询数据库是否存在 producer worker
    const worker = await WorkerService.getFor(
      constants.PRODUCER
    );

    /**
     * 发送 POST 请求 producer 服务器（转发）
     * @returns router
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
    /**
     * 发送 POST 请求 producer 服务器（转发）
     * @returns room
     */
    // const result = await fetchApi({
    //   host: worker.apiHost,
    //   port: worker.apiPort,
    //   path: '/room/create',
    //   method: 'POST',
    //   data: {
    //     pid: worker.pid,
    //     roomId: uuidv4() // TODO 待调整
    //   },
    // });

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
   * 创建房间
   * @param {  } data 接收客户端传递的数据
   * @returns
   */
  static async createRoom(data: any): Promise<any> {

    // 创建 worder service 实例，并调用实例方法 getFor 查询数据库是否存在 producer worker
    const worker = await WorkerService.getFor(
      constants.MASTER
    );

    // get a mediasoup Router.
    const mediasoupRouter = await MediaRouterService.createMediasoupRouter({
      pid: worker.pid
    })
    // const uuid = uuidv4() // TODO 待调整
    // const mediasoupRouterRtp = await this.create(Object.assign({}, {
    //   roomId: `room-${uuid}`
    // }, data))
    // console.log("%c Line:107 🍏 mediasoupRouterRtp", "color:#ed9ec7", mediasoupRouterRtp);
    

    const room = new Room({
      roomId: data.roomId,
      mediasoupRouter,
    });

    // 缓存 mediasoup router
    RoomService.rooms.set(room.roomId, room);

    return room
  }

  /**
   * 查询房间列表
   * @param param0 
   * @returns 
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
   * @param data 
   * @returns 
   */
  async getCapabilities(data: { roomId: string }): Promise<{
    id: string;
    rtpCapabilities: types.RtpCapabilities;
  }> {
    // 根据 roomId 查询某个房间
    const room = await this.get(data);
    // 发起 http 获取 rtpCapabilities（根据 routerId 查询 rtpCapabilities）
    const result = await fetchApi({
      host: room.worker.apiHost,
      port: room.worker.apiPort,
      path: '/routers/:routerId',
      method: 'GET',
      data: { routerId: room.routerId },
    });
    // 返回 rtpCapabilities
    return {
      ...result.rtpCapabilities,
      // id: data.roomId
    };
  }

  /**
   * 根据 roomId 查询房间
   * @param { { roomId: string } } data 传入一个包含 roomId 的对象
   * @returns 
   */
  async get(data: { roomId: string }) {
    // 从数据库中查询房间
    const roomData: MediaRoom = await MediaRoom.getRepository().findOne({
      relations: { worker: true },
      where: { id: data.roomId },
    });
    if (roomData) {
      return roomData;
    }
    throw new Error('Room not found');
  }

  /**
   * 根据 roomId 查询 room
   * @param { string } id media_room id 主键
   * @returns
   */
  async getRoom(id: string) {
    const roomData = await this.get({
      roomId: id
    })
    // 从缓存中获取 room
    const room = RoomService.rooms.get(roomData.roomId);
    if (room) {
      return room;
    }
    throw new Error('Room not found');
  }
  
  /**
   * 根据 roomId 删除房间
   * @param data 
   * @returns 
   */
  async close(data: { roomId: string }) {
    // 根据 roomId 查询房间
    const room = await this.get(data);
    // 关闭房间中所有consumer的router
    await this.closeConsumerRouters({ roomId: room.id });
    // 关闭 router
    await this.closeRouter({ routerId: room.routerId, worker: room.worker });
    // 删除数据库中的 room
    await MediaRoom.getRepository().delete({ id: room.id });
    // 返回空对象【FIX】
    return {};
  }

  /**
   * 关闭房间中所有consumer的router
   */
  private async closeConsumerRouters(data: { roomId: string }) {
    // 查询数据库取出相同 roomId 中的 routers
    const routers = await MediaRouter.getRepository().find({
      relations: { worker: true },
      where: { roomId: data.roomId },
    });
    // 异步关闭 router（房间）
    await Promise.all(
      routers.map((router) =>
        this.closeRouter({ routerId: router.id, worker: router.worker })
      )
    );
    return {};
  }

  /**
   * 关闭 router
   * @param data 
   */
  private async closeRouter(data: { routerId: string; worker: MediaWorker }) {
    // 发起 http 请求。根据 routerId 删除 router
    try {
      await fetchApi({
        host: data.worker.apiHost,
        port: data.worker.apiPort,
        path: '/routers/:routerId',
        method: 'DELETE',
        data: { routerId: data.routerId },
      });
    } catch { }
    // 查询数据库，相同 routerId 的 MediaTransport 的数据条数
    const count = await MediaTransport
      .getRepository()
      .count({ where: { routerId: data.routerId } });
    // 如果大于0
    if (count > 0) {
      // 修改 MediaWorker 表中的 transportCount
      await MediaWorker
        .getRepository()
        .decrement({ id: data.worker.id }, 'transportCount', count);
    }
    // 从数据库中删除 MediaRouter
    await MediaRouter
      .getRepository()
      .delete({ id: data.routerId });
  }
}
