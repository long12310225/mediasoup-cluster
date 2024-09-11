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
import { MediaDataProducerService } from '@/services/media.dataProdecer/media.dataProducer.service';

@Controller('/producer_data')
export class MediaDataProducerController {
  constructor(private readonly mediaDataProducerService: MediaDataProducerService) {}

  /**
   * 创建 dataProducer
   * @param data
   * @returns
   */
  @Post('/:transportId/create')
  createProduceData(@Params() data) {
    return this.mediaDataProducerService.createProduceData(data);
  }

  @Post('/:dataProducerId/getStats')
  getStats(@Params() data) {
    return this.mediaDataProducerService.getStats(data);
  }
}
