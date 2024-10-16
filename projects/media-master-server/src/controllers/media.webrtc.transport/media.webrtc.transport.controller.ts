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
import { MediasoupConsumerWebRTCTransport } from '../../services/media.webrtc.transport/mediasoup.consumer.webrtc.transport.service'
import { MediasoupProducerWebRTCTransport } from '../../services/media.webrtc.transport/mediasoup.producer.webrtc.transport.service'
import { Params } from '@/shared/decorators';

@Controller()
export class MediaWebRTCTransportController {

  constructor(
    private readonly mediasoupConsumerWebRTCTransport: MediasoupConsumerWebRTCTransport,
    private readonly mediasoupProducerWebRTCTransport: MediasoupProducerWebRTCTransport
  ) { }

  @Post('/routers/:routerId/consumer_transports')
  consumerCreate(@Param() data) {
    return this.mediasoupConsumerWebRTCTransport.create(data);
  }
  
  @Post('/routers/:routerId/producer_transports')
  producerCreate(@Param() data) {
    return this.mediasoupProducerWebRTCTransport.create(data);
  }

  /**
   * 根据 transportId 连接 transport
   * @param data 
   * @returns 
   */
  @Post('/producer_transports/:transportId/connect')
  producerConnect(@Params() data) {
    return this.mediasoupProducerWebRTCTransport.connect(data)
  }

  /**
   * 关闭 consumer
   * @param data 
   */
  @Delete('/consumer_transports/:transportId')
  consumerClose(@Params() data) {
    this.mediasoupConsumerWebRTCTransport.close(data)
  }

  /**
   * 关闭 producer
   * @param data 
   */
  @Delete('/producer_transports/:transportId')
  ProducerClose(@Params() data) {
    this.mediasoupProducerWebRTCTransport.close(data)
  }

  /**
   * 根据 transportId 连接 transport
   * @param data 
   * @returns 
   */
  @Post('/consumer_transports/:transportId/connect')
  consumerConnect(@Params() data) {
    return this.mediasoupConsumerWebRTCTransport.connect(data);
  }
}
