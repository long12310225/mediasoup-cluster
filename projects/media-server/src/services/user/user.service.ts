import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaTransport } from '@/dao/transport/media.transport.do';
import { TransportService } from '../transport/transport.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(MediaTransport)
    private readonly mediaTransport: MediaTransport,
    private readonly transportService: TransportService
  ) {}

  /**
   * if data.roomId is not undefined, make user logout from this room.
   * Otherwise make user logout from all room.
   */
  public async logout(data: { userId: string; roomId?: string }) {
    // 根据 roomId 和 userId 从数据库找出对应的 transports
    const transports = await MediaTransport
      .getRepository()
      .find({
        relations: { worker: true },
        where: {
          // userId: data.userId,
          roomId: data.roomId
        },
      });
    
    // 异步关闭 transport
    await Promise.all(
      transports.map(async (transport) => {
        await this.transportService.closeTransport(transport);

        // this.removeEmptyRoom(transport);
      })
    );

    // 返回了不合规范的对象
    return {};
  }

  // async removeEmptyRoom(data: { roomId: string }) {
  //   const exist = await MediaTransport
  //     .getRepository()
  //     .findOne({
  //       select: { id: true },
  //       where: { roomId: data.roomId },
  //     });
  //   // if no one in room
  //   if (!exist) {
  //     this.createService(RoomService).close(data);
  //   }
  // }
}
