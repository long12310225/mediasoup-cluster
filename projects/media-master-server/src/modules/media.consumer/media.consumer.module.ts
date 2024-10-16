import { Module } from '@nestjs/common';
import { MediaConsumerController } from '../../controllers/media.consumer/media.consumer.controller';
import { MediaConsumerService } from '../../services/media.consumer/media.consumer.service';
import { MediasoupConsumerWebRTCTransport } from '../..//services/media.webrtc.transport/mediasoup.consumer.webrtc.transport.service';
import { MediaRouterService } from '../..//services/media.router/media.router.service';

@Module({
  controllers: [MediaConsumerController],
  providers: [MediaConsumerService, MediasoupConsumerWebRTCTransport, MediaRouterService],
})
export class MediaConsumerModule { }
