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
import { Params } from '@/shared/decorators';
import { MediaProducerService } from '@/services/media.producer/media.producer.service';

@Controller()
export class MediaProducerController {
  constructor(
    private readonly mediaProducerService: MediaProducerService
  ) { }

  @Post('/transports/:transportId/producer')
  create(@Params() data) {
    return this.mediaProducerService.create(data);
  }

  /**
   * 根据 producerId 暂停媒体流
   * @param data 
   */
  @Post('/producers/:producerId/pause')
  pause(@Params() data) {
    return this.mediaProducerService.pause(data);
  }

  /**
   * 根据 producerId 重连媒体流
   * @param data 
   */
  @Post('/producers/:producerId/resume')
  resume(@Params() data) {
    return this.mediaProducerService.resume(data);
  }
}
