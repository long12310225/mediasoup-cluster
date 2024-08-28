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
import { Params } from '@/common/decorators';

@Controller()
export class MediaRouterController {
  constructor(private readonly mediaRouterService: MediaRouterService) {}

  /**
   * 创建 mediasoup router
   */
  @Post('/routers')
  create(@Body() data: { pid: number }) {
    return this.mediaRouterService.create(data);
  }

  /**
   * 根据 routerId 查询 rtpCapabilities
   */
  @Get('/routers/:routerId')
  getRtpCapabilities(@Param() data: { routerId: string }) {
    return this.mediaRouterService.getRtpCapabilities(data);
  }

  @Delete('/routers/:routerId')
  close(@Param() data) { 
    // 根据 routerId 删除 router
    return this.mediaRouterService.close(data);
  }

}
