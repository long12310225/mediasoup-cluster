import { Module } from '@nestjs/common';
import { MediaDataProducerController } from '@/controllers/media.dataProdecer/media.dataProducer.controller';
import { MediaDataProducerService } from '@/services/media.dataProdecer/media.dataProducer.service';
import { MediasoupProducerWebRTCTransport } from '@/services/media.webrtc.transport/mediasoup.producer.webrtc.transport.service';
import { MediaRouterService } from '@/services/media.router/media.router.service';

@Module({
  controllers: [MediaDataProducerController],
  providers: [MediaDataProducerService, MediasoupProducerWebRTCTransport, MediaRouterService],
})
export class MediaDataProducerModule {}
