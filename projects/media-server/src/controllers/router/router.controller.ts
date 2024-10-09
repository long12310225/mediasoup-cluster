import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Params } from '@/common/decorators';
import { RouterService } from '../../services/router/router.service';

@Controller()
export class RouterController {
  constructor(
    private readonly routerService: RouterService
  ) { }
  
  /**
   *  创建消费者router
   */
  @Post('/rooms/:roomId/consumer_routers')
  getOrCreate(@Param() data: { roomId: string }) { 
    return this.routerService.getOrCreate(data);
  }

  /**
   * 查询router列表
   */
  @Get('/routers/getList')
  getList() {
    return this.routerService.getList()
  }

  /**
   * 移除某条router的数据
   */
  @Delete('/routers/removeOne')
  deleteRouter(@Params() data) {
    return this.routerService.deleteRouter(data)
  }
}
