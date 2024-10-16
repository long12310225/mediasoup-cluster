import { Module } from '@nestjs/common';
import { MediaWebRTCTransportController } from '../../controllers/media.webrtc.transport/media.webrtc.transport.controller';
import { MediasoupProducerWebRTCTransport } from '@/services/media.webrtc.transport/mediasoup.producer.webrtc.transport.service';
import { MediasoupConsumerWebRTCTransport } from '@/services/media.webrtc.transport/mediasoup.consumer.webrtc.transport.service';
import { MediaRouterService } from '../../services/media.router/media.router.service'

@Module({
  controllers: [MediaWebRTCTransportController],
  providers: [
    MediasoupProducerWebRTCTransport,
    MediasoupConsumerWebRTCTransport,
    MediaRouterService
  ],
})
export class MediaWebRTCTransportModule {}
