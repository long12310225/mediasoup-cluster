import { Module } from '@nestjs/common';
import { MediaConsumerController } from '../../controllers/media.consumer/media.consumer.controller';
import { MediaConsumerService } from '../../services/media.consumer/media.consumer.service';
import { ConsumerMediaWebRTCTransport } from '../../services/media.webrtc.transport/consumer.media.webrtc.transport.service';
import { MediaPlainTransportService } from '@/services/media.plain.transport/media.plain.transport.service';
import { MediaRouterService } from '../../services/media.router/media.router.service';

@Module({
  controllers: [MediaConsumerController],
  providers: [
    MediaConsumerService,
    ConsumerMediaWebRTCTransport,
    MediaPlainTransportService,
    MediaRouterService,
  ],
})
export class MediaConsumerModule {}
