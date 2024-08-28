import { Module } from '@nestjs/common';
import { MediaDataProducerController } from '@/controllers/media.dataProdecer/media.dataProducer.controller';
import { MediaDataProducerService } from '@/services/media.dataProdecer/media.dataProducer.service';
import { ProducerMediaWebRTCTransport } from '@/services/media.webrtc.transport/producer.media.webrtc.transport.service';
import { MediaRouterService } from '@/services/media.router/media.router.service';

@Module({
  controllers: [MediaDataProducerController],
  providers: [MediaDataProducerService, ProducerMediaWebRTCTransport, MediaRouterService],
})
export class MediaDataProducerModule {}
