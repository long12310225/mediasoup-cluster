import { Controller, Post, Body } from "@nestjs/common";
import { MediaRoomService } from '../../services/media.room/media.room.service';

@Controller()
export class MediaRoomController {
  constructor(private readonly roomService: MediaRoomService) {}

  /**
   * 创建 room 
   */
  @Post('/room/create')
  create(@Body() data: { pid: number, roomId: string }) {
    return this.roomService.create(data);
  }
}