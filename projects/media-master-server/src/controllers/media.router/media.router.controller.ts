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
import { MediaRouterService } from '../../services/media.router/media.router.service';
import { Params } from '@/shared/decorators';

@Controller()
export class MediaRouterController {
  constructor(private readonly routerService: MediaRouterService) {}

  /**
   * 创建 mediasoup router
   */
  @Post('/routers')
  create(@Body() data: { pid: number }) {
    return this.routerService.create(data);
  }

  /**
   * 根据 routerId 查询 rtpCapabilities
   */
  @Get('/routers/:routerId')
  getRtpCapabilities(@Param() data: { routerId: string }) {
    return this.routerService.getRtpCapabilities(data);
  }

  @Delete('/routers/:routerId')
  close(@Param() data) { 
    // 根据 routerId 删除 router
    return this.routerService.close(data);
  }
}
