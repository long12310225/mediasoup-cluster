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
import { MediaDataConsumerService } from '@/services/media.dataConsumer/media.dataConsumer.service';

@Controller()
export class MediaDataConsumerController {
  constructor(
    private readonly mediaDataConsumerService: MediaDataConsumerService,
  ) {}

  /**
   * 创建 dataConsumer
   * @param data
   * @returns
   */
  @Post('/consumer_data/:transportId/create')
  createConsumeData(@Params() data) {
    return this.mediaDataConsumerService.createConsumeData(data);
  }

  @Post('/consumer_data/:dataConsumerId/getStats')
  getStats(@Params() data) {
    return this.mediaDataConsumerService.getStats(data);
  }

  @Post('/consumer_data/:dataConsumerId/pause')
  pause(@Params() data) {
    return this.mediaDataConsumerService.pause(data);
  }

  @Post('/consumer_data/:dataConsumerId/resume')
  resume(@Params() data) {
    return this.mediaDataConsumerService.resume(data);
  }
}
