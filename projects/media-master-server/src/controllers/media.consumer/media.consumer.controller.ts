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

@Controller()
export class MediaConsumerController {
  constructor(private readonly mediaConsumerService: MediaConsumerService) {}

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
   * 根据 consumerId 暂停媒体流
   * @param data 
   */
  @Post('/consumers/:consumerId/pause')
  pause(@Params() data) {
    return this.mediaConsumerService.pause(data);
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

  /**
   * 根据 consumerId，设置消费首选图层
   * @param data 
   * @returns 
   */
  @Post('/consumers/:consumerId/setPreferredLayers')
  setPreferredLayers(@Params() data) {
    return this.mediaConsumerService.setPreferredLayers(data);
  }

  /**
   * 根据 consumerId，设置消费优先级
   * @param data 
   * @returns 
   */
  @Post('/consumers/:consumerId/setPriority')
  setPriority(@Params() data) {
    return this.mediaConsumerService.setPriority(data);
  }

  /**
   * 根据 consumerId，设置请求消费关键帧
   * @param data 
   * @returns 
   */
  @Post('/consumers/:consumerId/requestKeyFrame')
  requestKeyFrame(@Params() data) {
    return this.mediaConsumerService.requestKeyFrame(data);
  }

  @Post('/consumers/:consumerId/getStats')
  getStats(@Params() data) {
    return this.mediaConsumerService.getStats(data);
  }
}
