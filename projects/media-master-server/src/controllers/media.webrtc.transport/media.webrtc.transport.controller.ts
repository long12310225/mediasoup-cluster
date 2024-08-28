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
import { ConsumerMediaWebRTCTransport } from '../../services/media.webrtc.transport/consumer.media.webrtc.transport.service'
import { ProducerMediaWebRTCTransport } from '../../services/media.webrtc.transport/producer.media.webrtc.transport.service'
import { Params } from '@/common/decorators';

@Controller()
export class MediaWebRTCTransportController {

  constructor(
    private readonly mediasoupConsumerWebRTCTransport: ConsumerMediaWebRTCTransport,
    private readonly mediasoupProducerWebRTCTransport: ProducerMediaWebRTCTransport
  ) { }

  @Post('/routers/:routerId/consumer_transports')
  consumerCreate(@Params() data) {
    return this.mediasoupConsumerWebRTCTransport.createMediasoupWebRTCTransport(data);
  }
  
  @Post('/routers/:routerId/producer_transports')
  producerCreate(@Params() data) {
    return this.mediasoupProducerWebRTCTransport.createMediasoupWebRTCTransport(data);
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
   * 根据 transportId 连接 transport
   * @param data 
   * @returns 
   */
  @Post('/consumer_transports/:transportId/connect')
  consumerConnect(@Params() data) {
    return this.mediasoupConsumerWebRTCTransport.connect(data);
  }

  /**
   * 重启 producer webrtctransports ICE协商
   * @param data 
   * @returns 
   */
  @Post('/producer_webrtctransports/:transportId/restartIce')
  producerWebrtctransportRestartIce(@Params() data) {
    return this.mediasoupProducerWebRTCTransport.webRTCTransportRestartIce(data);
  }

  /**
   * 重启 consumer webrtctransports ICE协商
   * @param data 
   * @returns 
   */
  @Post('/consumer_webrtctransports/:transportId/restartIce')
  consumerWebrtctransportRestartIce(@Params() data) {
    return this.mediasoupConsumerWebRTCTransport.webRTCTransportRestartIce(data);
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

}
