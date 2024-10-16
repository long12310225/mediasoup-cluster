import { Module } from '@nestjs/common';
import { MediaProducerController } from '@/controllers/media.producer/media.producer.controller';
import { MediaProducerService } from '@/services/media.producer/media.producer.service';
import { MediasoupProducerWebRTCTransport } from '@/services/media.webrtc.transport/mediasoup.producer.webrtc.transport.service';
import { MediaRouterService } from '@/services/media.router/media.router.service';

@Module({
  controllers: [MediaProducerController],
  providers: [MediaProducerService, MediasoupProducerWebRTCTransport, MediaRouterService],
})
export class MediaProducerModule {}
