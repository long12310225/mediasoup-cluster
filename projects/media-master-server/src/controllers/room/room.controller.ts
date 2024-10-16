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
import { Params } from '@/shared/decorators';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * 创建房间
   */
  @Post('/rooms')
  @HttpCode(200)
  create(@Body() data) { 
    const uuid = uuidv4() // TODO 待调整
    return RoomService.create(Object.assign({}, {
      roomId: `room-${uuid}`
    }, data))
  }

  /**
   * 删除某个房间
   * @param data 
   */
  @Delete('/rooms/:roomId')
  close(@Params() data) {
    return this.roomService.close(data)
  }

  /**
   * 查询房间列表
   * @param data 
   */
  @Get('/rooms')
  getList(@Params() data) {
    return this.roomService.getList(data)
  }

  /**
   * 查询房间详情
   * @param data 
   */
  @Get('/rooms/:roomId')
  getCapabilities(@Params() data) {
    return this.roomService.getCapabilities(data)
  }
}
