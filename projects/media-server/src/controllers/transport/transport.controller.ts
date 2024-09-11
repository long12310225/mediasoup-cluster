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
import { TransportService } from '../../services/transport/transport.service';
import { Params } from '@/common/decorators';
import { CreateTransportDo } from '@/dto';

@Controller()
export class TransportController {
  constructor(
    private readonly transportService: TransportService
  ) { }

  /**
   * 创建 consumer transport
   * @param data
   * @returns
   */
  @Post('/router/:routerId/consumer_transports')
  createConsumer(@Param() data: CreateTransportDo) {
    return this.transportService.createConsumerTransport(data);
  }

  /**
   * 创建 producer transport
   * @param data 
   * @returns
   */
  @Post('/rooms/:roomId/producer_transports')
  createProducer(@Param() data: CreateTransportDo) {
    return this.transportService.createProducerTransport(data)
  }

  /**
   * 连接 producer
   * @param data 
   * @returns 
   */
  @Post('/producer_transports/:transportId/connect')
  connectProducer(@Params() data) {
    return this.transportService.connectProducer(data)
  }

  /**
   * 获取 producers
   */
  @Get('/rooms/:roomId/producer_transports')
  getProducers(@Param() data) {
    return this.transportService.getProducers(data);
  }

  /**
   * 连接 consumer
   * @param data 
   */
  @Post('/consumer_transports/:transportId/connect')
  connectConsumer(@Params() data) {
    return this.transportService.connectConsumer(data);
  }

  /**
   * 创建相同host地址的consumer
   */
  @Post('/rooms/:roomId/consumer_transports')
  createSameHostConsumer(@Params() data) {
    return this.transportService.createSameHostConsumer(
      data
    );
  }

  /**
   * 关闭 transport
   * @param data 
   * @returns 
   */
  @Delete('/transports/:transportId')
  close(@Params() data) {
    return this.transportService.close(data);
  }
}
