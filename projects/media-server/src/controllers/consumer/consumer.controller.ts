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
import { ConsumerService } from '@/services/consumer/consumer.service';
import { Params } from '@/common/decorators';

@Controller()
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}

  /**
   * 创建 consumer
   */
  // @Post('/consumer_transports/:transportId/consume')
  // create(@Params() data) { 
  //   return this.consumerService.create(data)
  // }
  /**
   * resume consumer
   */
  @Post('/consumers/:consumerId/resume')
  resume(@Params() data) { 
    return this.consumerService.resume(data);
  }

  /**
   * 移除某条数据
   */
  @Delete('/consumers/:consumerId/removeOne')
  deleteConsumer(@Params() data) {
    return this.consumerService.deleteConsumer(data)
  }
}
