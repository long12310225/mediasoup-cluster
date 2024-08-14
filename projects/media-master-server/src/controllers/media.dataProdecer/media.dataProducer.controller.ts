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
import { MediaDataProducerService } from '@/services/media.dataProdecer/media.dataProducer.service';

@Controller()
export class MediaDataProducerController {
  constructor(private readonly mediaDataProducerService: MediaDataProducerService) {}

  /**
   * 创建 dataProducer
   * @param data
   * @returns
   */
  @Post('/producer_data/:transportId/create')
  createProduceData(@Params() data) {
    return this.mediaDataProducerService.createProduceData(data);
  }

  @Post('/producer_data/:dataProducerId/getStats')
  getStats(@Params() data) {
    return this.mediaDataProducerService.getStats(data);
  }
}
