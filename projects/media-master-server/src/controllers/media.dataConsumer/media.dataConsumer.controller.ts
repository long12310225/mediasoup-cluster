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
import { MediaDataConsumerService } from '@/services/media.dataConsumer/media.dataConsumer.service';

@Controller('/consumer_data')
export class MediaDataConsumerController {
  constructor(
    private readonly mediaDataConsumerService: MediaDataConsumerService,
  ) {}

  /**
   * 创建 dataConsumer
   * @param data
   * @returns
   */
  @Post('/:transportId/create')
  createConsumeData(@Params() data) {
    return this.mediaDataConsumerService.createConsumeData(data);
  }

  @Post('/:dataConsumerId/getStats')
  getStats(@Params() data) {
    return this.mediaDataConsumerService.getStats(data);
  }

  @Post('/:dataConsumerId/pause')
  pause(@Params() data) {
    return this.mediaDataConsumerService.pause(data);
  }

  @Post('/:dataConsumerId/resume')
  resume(@Params() data) {
    return this.mediaDataConsumerService.resume(data);
  }
}
