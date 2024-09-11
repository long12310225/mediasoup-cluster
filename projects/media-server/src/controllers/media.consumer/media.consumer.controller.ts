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
import { MediaConsumerService } from '../../services/media.consumer/media.consumer.service';
import { CreateConsumerDo, ConsumerDo } from '@/dto';

@Controller('/consumers')
export class MediaConsumerController {
  constructor(private readonly mediaConsumerService: MediaConsumerService) {}

  /**
   * 创建 mediasoup consumer
   */
  @Post('/:transportId/consumer')
  create(@Params() data: CreateConsumerDo) {
    return this.mediaConsumerService.create(data);
  }

  /**
   * 根据 consumerId 暂停媒体流
   */
  @Post('/:consumerId/pause')
  pause(@Params() data: ConsumerDo) {
    return this.mediaConsumerService.pause(data);
  }

  /**
   * 根据 consumerId，resume consumer
   */
  @Post('/:consumerId/resume')
  resume(@Params() data: ConsumerDo) {
    return this.mediaConsumerService.resume(data);
  }

  /**
   * 根据 consumerId，设置消费首选图层
   */
  @Post('/:consumerId/setPreferredLayers')
  setPreferredLayers(@Params() data: ConsumerDo) {
    return this.mediaConsumerService.setPreferredLayers(data);
  }

  /**
   * 根据 consumerId，设置消费优先级
   */
  @Post('/:consumerId/setPriority')
  setPriority(@Params() data: ConsumerDo) {
    return this.mediaConsumerService.setPriority(data);
  }

  /**
   * 根据 consumerId，设置请求消费关键帧
   */
  @Post('/:consumerId/requestKeyFrame')
  requestKeyFrame(@Params() data: ConsumerDo) {
    return this.mediaConsumerService.requestKeyFrame(data);
  }

  @Post('/:consumerId/getStats')
  getStats(@Params() data: ConsumerDo) {
    return this.mediaConsumerService.getStats(data);
  }
}
