import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Delete,
  Body,
  Param,
  HttpCode
} from '@nestjs/common';
import { RoomService } from '../../services/room/room.service';
import { Params } from '@/common/decorators';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * 创建房间
   */
  @Post('/rooms')
  createProducerRoom(@Body() data) {
    return this.roomService.createProducerRoom(data)
  }

  /**
   * 删除某个房间
   */
  @Delete('/rooms/:roomId')
  close(@Params() data) {
    return this.roomService.close(data)
  }

  /**
   * 查询房间列表
   */
  @Get('/rooms')
  getList(@Params() data) {
    return this.roomService.getList(data)
  }

  /**
   * 获取房间的RTP能力
   */
  @Get('/rooms/:roomId')
  @HttpCode(200)
  getCapabilities(@Params() data) {
    return this.roomService.getCapabilities(data)
  }

  /**
   * 移除某条房间的数据
   */
  @Delete('/rooms/removeOne')
  deleteRoom(@Params() data) {
    return this.roomService.deleteRoom(data)
  }
}
