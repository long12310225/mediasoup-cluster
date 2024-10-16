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
}
