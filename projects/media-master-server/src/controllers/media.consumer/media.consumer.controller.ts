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
import { MediaConsumerService } from '../../services/media.consumer/media.consumer.service';

@Controller()
export class MediaConsumerController {
  constructor(
    private readonly mediaConsumerService: MediaConsumerService
  ) { }

  /**
   * 创建 mediasoup consumer
   * @param data 
   * @returns 
   */
  @Post('/transports/:transportId/consumer')
  create(@Params() data) {
    return this.mediaConsumerService.create(data);
  }

  /**
   * 根据 consumerId，resume consumer
   * @param data 
   * @returns 
   */
  @Post('/consumers/:consumerId/resume')
  resume(@Params() data) {
    return this.mediaConsumerService.resume(data);
  }
}
