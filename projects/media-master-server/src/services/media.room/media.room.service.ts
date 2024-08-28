import { Injectable } from '@nestjs/common';
import { MediaRouterService } from '../media.router/media.router.service';
import { ProducerMediaWebRTCTransport } from "@/services/media.webrtc.transport/producer.media.webrtc.transport.service";
import { ConsumerMediaWebRTCTransport } from "@/services/media.webrtc.transport/consumer.media.webrtc.transport.service";
import { MediaProducerService } from "@/services/media.producer/media.producer.service";
import { MediaConsumerService } from "@/services/media.consumer/media.consumer.service";
import { MediaDataProducerService } from "@/services/media.dataProdecer/media.dataProducer.service";
import { MediaDataConsumerService } from "@/services/media.dataConsumer/media.dataConsumer.service";
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class MediaRoomService {

  constructor(
    private readonly logger: PinoLogger,
    private readonly mediaRouterService: MediaRouterService,
    private readonly mediasoupProducerWebRTCTransport: ProducerMediaWebRTCTransport,
    private readonly mediasoupConsumerWebRTCTransport: ConsumerMediaWebRTCTransport,
    private readonly mediaProducerService: MediaProducerService,
    private readonly mediaConsumerService: MediaConsumerService,
    private readonly mediaDataProducerService: MediaDataProducerService,
    private readonly mediaDataConsumerService: MediaDataConsumerService,
  ) { 
    this.logger.setContext(MediaRoomService.name)
  }

  /**
   * 创建 mediasoup router
   * @param { { pid: number, roomId: string } } data
   * @returns
   */
  async create(data: { pid: number, roomId: string }) {

    // Create a mediasoup Router.
    const mediasoupRouter = await this.mediaRouterService.createMediasoupRouter({
      pid: data.pid
    })

    return {
      roomId: data.roomId,
      routerId: mediasoupRouter.id,
      // 下方参数没啥用
      rtpCapabilities: mediasoupRouter.rtpCapabilities,
      appData: mediasoupRouter.appData,
      observer: mediasoupRouter.observer
    }

  }

  async getRouter(data: { roomId: string }) {
    console.log("=====================================================");
    console.log("=================== 从服务资源缓存 =====================");
    console.log("=====================================================");
    const mediaRouters = this.mediaRouterService.getRouters(data);
    console.log("%c Line:38 🍒 mediaRouters", "color:#ed9ec7", mediaRouters);
    const mediasoupProducerWebRTCTransports = this.mediasoupProducerWebRTCTransport.getWebRTCTransport(data);
    console.log("%c Line:40 🍒 mediasoupProducerWebRTCTransports", "color:#33a5ff", mediasoupProducerWebRTCTransports);
    const mediasoupConsumerWebRTCTransport = this.mediasoupConsumerWebRTCTransport.getWebRTCTransport(data);
    console.log("%c Line:42 🥥 mediasoupConsumerWebRTCTransport", "color:#6ec1c2", mediasoupConsumerWebRTCTransport);
    const mediaProducers = this.mediaProducerService.getProducers(data)
    console.log("%c Line:44 🥐 mediaProducers", "color:#7f2b82", mediaProducers);
    const mediaDataProducers = this.mediaDataProducerService.getDataProducers(data)
    console.log("%c Line:48 🥐 mediaDataProducers", "color:#f5ce50", mediaDataProducers);
    const mediaConsumers = this.mediaConsumerService.getConsumers(data)
    console.log("%c Line:46 🍕 mediaConsumers", "color:#fca650", mediaConsumers);
    const mediaDataConsumers = this.mediaDataConsumerService.getDataConsumers(data)
    console.log("%c Line:50 🍕 mediaDataConsumers", "color:#33a5ff", mediaDataConsumers);
    console.log("-----------------------------------------------------");
    console.log("-----------------------------------------------------");
    console.log("-----------------------------------------------------");
  }

}
