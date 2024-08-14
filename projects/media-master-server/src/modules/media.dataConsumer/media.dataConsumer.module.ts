import { Module } from '@nestjs/common';
import { MediaDataConsumerController } from '@/controllers/media.dataConsumer/media.dataConsumer.controller';
import { MediaDataConsumerService } from '@/services/media.dataConsumer/media.dataConsumer.service';
import { MediasoupConsumerWebRTCTransport } from '../../services/media.webrtc.transport/mediasoup.consumer.webrtc.transport.service';
import { MediaRouterService } from '../../services/media.router/media.router.service';

@Module({
  controllers: [MediaDataConsumerController],
  providers: [MediaDataConsumerService, MediasoupConsumerWebRTCTransport, MediaRouterService],
})
export class MediaDataConsumerModule { }
