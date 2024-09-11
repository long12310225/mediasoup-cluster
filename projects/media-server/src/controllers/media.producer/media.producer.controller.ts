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
import { MediaProducerService } from '@/services/media.producer/media.producer.service';
import { CreateProducerDo, ProducerDo } from '@/dto';

@Controller('/producers')
export class MediaProducerController {
  constructor(
    private readonly mediaProducerService: MediaProducerService
  ) { }

  @Post('/:transportId/producer')
  create(@Params() data: CreateProducerDo) {
    return this.mediaProducerService.create(data);
  }

  /**
   * 根据 producerId 暂停媒体流
   */
  @Post('/:producerId/pause')
  pause(@Params() data: ProducerDo) {
    return this.mediaProducerService.pause(data);
  }

  /**
   * 根据 producerId 重连媒体流
   */
  @Post('/:producerId/resume')
  resume(@Params() data: ProducerDo) {
    return this.mediaProducerService.resume(data);
  }
  
  /**
   * 关闭 producer
   */
  @Post('/:producerId/close')
  close(@Params() data: ProducerDo) {
    return this.mediaProducerService.close(data);
  }

  @Post('/:producerId/getStats')
  getStats(@Params() data: ProducerDo) {
    return this.mediaProducerService.getStats(data);
  }
}
