import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { MediaRoomService } from '../../services/media.room/media.room.service';
import { MediaRouterService } from '../../services/media.router/media.router.service';

@Controller()
export class MediaRoomController {
  constructor(
    private readonly roomService: MediaRoomService,
    
  ) { }

  /**
   * 创建 room 
   */
  @Post('/room/create')
  create(@Body() data: { pid: number, roomId: string }) {
    return this.roomService.create(data);
  }

  /**
   * 根据 roomId 查询 router
   */
  @Get('/getrouters')
  getRouter(@Query() data: { roomId: string }) {
    return this.roomService.getRouter(data)
  }
}