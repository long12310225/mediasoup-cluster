import { Module } from '@nestjs/common';
import { MediaDataConsumerController } from '@/controllers/media.dataConsumer/media.dataConsumer.controller';
import { MediaDataConsumerService } from '@/services/media.dataConsumer/media.dataConsumer.service';
import { ConsumerMediaWebRTCTransport } from '../../services/media.webrtc.transport/consumer.media.webrtc.transport.service';
import { MediaRouterService } from '../../services/media.router/media.router.service';

@Module({
  controllers: [MediaDataConsumerController],
  providers: [MediaDataConsumerService, ConsumerMediaWebRTCTransport, MediaRouterService],
})
export class MediaDataConsumerModule { }
