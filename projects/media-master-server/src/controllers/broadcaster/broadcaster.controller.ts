import { Controller, Post, Get, HttpCode, Delete,Body } from '@nestjs/common';
import { Params } from '@/common/decorators';
import { BroadcasterDto, BroadcasterTransportDto, ConnectBroadcasterTransportDto } from '@/dto';
import { BroadcasterService } from '@/services/broadcaster/broadcaster.service';

@Controller()
export class BroadcasterController {
  constructor(private readonly broadcasterService: BroadcasterService) { }
  
  @Post('/rooms/:roomId/broadcasters')
  @HttpCode(200)
  createBroadcaster(@Params() data: BroadcasterDto) {
    return this.broadcasterService.createBroadcaster(data)
  }

  @Delete('/rooms/:roomId/broadcasters/:broadcasterId')
  @HttpCode(200)
  deleteBroadcaster(@Params() data) {
    return this.broadcasterService.deleteBroadcaster(data)
  }

  @Post('/rooms/:roomId/broadcasters/:broadcasterId/transports')
  @HttpCode(200)
  createBroadcasterTransport(@Params() data: BroadcasterTransportDto) {
    return this.broadcasterService.createBroadcasterTransport(data) 
  }

  @Post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect')
  @HttpCode(200)
  connectBroadcasterTransport(@Params() data: ConnectBroadcasterTransportDto) {
    return this.broadcasterService.connectBroadcasterTransport(data) 
  }

  @Post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/plainconnect')
  @HttpCode(200)
  connectBroadcasterPlainTransport(@Params() data) {
    return this.broadcasterService.connectBroadcasterPlainTransport(data) 
  }

  @Post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers')
  @HttpCode(200)
  createBroadcasterProducer(@Params() data) {
    return this.broadcasterService.createBroadcasterProducer(data) 
  }

  @Post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume')
  @HttpCode(200)
  createBroadcasterConsumer(@Params() data) {
    return this.broadcasterService.createBroadcasterConsumer(data) 
  }

  @Post('/rooms/:roomId/broadcasters/:broadcasterId/consume/:consumeId/resume')
  @HttpCode(200)
  consumerRsume(@Params() data) {
    return this.broadcasterService.consumerResume(data) 
  }

  @Post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume/data')
  @HttpCode(200)
  createBroadcasterDataConsumer(@Params() data) {
    return this.broadcasterService.createBroadcasterDataConsumer(data) 
  }

  @Post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/produce/data')
  @HttpCode(200)
  createBroadcasterDataProducer(@Params() data) {
    return this.broadcasterService.createBroadcasterDataProducer(data) 
  }

  @Post('/broadcast/consumer/handle')
  broadcastConsumerHandle(@Body() data) {
    return this.broadcasterService.broadcastConsumerHandle(data);
  }
  
  @Post('/broadcast/dataConsumer/handle')
  broadcastDataConsumerHandle(@Body() data) {
    return this.broadcasterService.broadcastDataConsumerHandle(data);
  }
  
  @Post('/broadcast/dataProducer/handle')
  broadcasterDataProducerHandle(@Body() data) {
    return this.broadcasterService.broadcasterDataProducerHandle(data);
  }
}
