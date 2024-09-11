import { Module } from '@nestjs/common';
import { MediaWebRTCTransportController } from '../../controllers/media.webrtc.transport/media.webrtc.transport.controller';
import { ProducerMediaWebRTCTransport } from '@/services/media.webrtc.transport/producer.media.webrtc.transport.service';
import { ConsumerMediaWebRTCTransport } from '@/services/media.webrtc.transport/consumer.media.webrtc.transport.service';
import { MediaRouterService } from '../../services/media.router/media.router.service'

@Module({
  controllers: [MediaWebRTCTransportController],
  providers: [
    ProducerMediaWebRTCTransport,
    ConsumerMediaWebRTCTransport,
    MediaRouterService
  ],
})
export class MediaWebRTCTransportModule {}
