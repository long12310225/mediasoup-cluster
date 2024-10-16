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
import { ProducerService } from '@/services/producer/producer.service';
import { Params } from '@/shared/decorators';

@Controller()
export class ProducerController {
  constructor(private readonly producerService: ProducerService) {}

  /**
   * 创建 producer
   */
  @Post('/producer_transports/:transportId/produce')
  create(@Params() data) { 
    return this.producerService.create(data)
  }

  /**
   * 根据 producerId 暂停媒体流
   * @param data 
   */
  @Post('/producers/:producerId/pause')
  pause(@Params() data) {
    return this.producerService.pause(data)
  }

  /**
   * 根据 producerId 重连媒体流
   */
  @Post('/producers/:producerId/resume')
  resume(@Params() data) { 
    return this.producerService.resume(data)
  }
}
