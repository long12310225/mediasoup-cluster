import { Injectable } from '@nestjs/common';
import { mediasoupWorkerManager } from '@/shared/libs/worker';
import Room from '@/shared/ws/Room';
import Bot from '@/shared/ws/Bot';
import env from '@/config/env';
import protoo from '@/shared/protoo-server';
import { MediaRouterService } from '../media.router/media.router.service';

@Injectable()
export class MediaRoomService {
  // 缓存 rooms
  static rooms = new Map<string, any>();

  constructor(
    private readonly mediaRouterService: MediaRouterService
  ) { }

  /**
   * 创建 mediasoup router
   * @param { { pid: number, roomId: string } } data
   * @returns
   */
  async create(data: { pid: number, roomId: string }) {
    // 创建protoo的Room实例
    // Create a protoo Room instance.
    const protooRoom = new protoo.Room();

    // Create a mediasoup Router.
    // const mediasoupRouter = await this.mediaRouterService.createMediasoupRouter({
    //   pid: data.pid
    // })
    
    // // Create a mediasoup AudioLevelObserver.
    // const audioLevelObserver = await mediasoupRouter.createAudioLevelObserver({
    //   maxEntries: 1,
    //   threshold: -80,
    //   interval: 800,
    // });

    // const bot = await Bot.create({ mediasoupRouter });

    // const room = new Room({
    //   roomId: data.roomId,
    //   protooRoom,
    //   mediasoupRouter,
    //   audioLevelObserver,
    //   bot,
    // });

    // // console.log('%c Line:103 🥃 room', 'color:#6ec1c2', room);

    // // 缓存 mediasoup router
    // MediaRoomService.rooms.set(room.roomId, room);

    // return {
    //   roomId: data.roomId,
    //   routerId: mediasoupRouter.id
    // }

    return {}
  }

  /**
   * 根据 roomId 查询 room
   * @param { string } id roomId
   * @returns
   */
  get(id: string) {
    // 从缓存中获取 room
    const room = MediaRoomService.rooms.get(id);
    if (room) {
      return room;
    }
    throw new Error('Room not found');
  }
}
