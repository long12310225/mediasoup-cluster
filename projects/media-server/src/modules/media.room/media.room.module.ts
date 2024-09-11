import { Module } from '@nestjs/common';
import { MediaRoomController } from '../../controllers/media.room/media.room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MediaRoomService } from '@/services/media.room/media.room.service';
import { MediaRouterService } from '@/services//media.router/media.router.service';
import { ProducerMediaWebRTCTransport } from "@/services/media.webrtc.transport/producer.media.webrtc.transport.service";
import { ConsumerMediaWebRTCTransport } from "@/services/media.webrtc.transport/consumer.media.webrtc.transport.service";
import { MediaProducerService } from "@/services/media.producer/media.producer.service";
import { MediaConsumerService } from "@/services/media.consumer/media.consumer.service";
import { MediaDataProducerService } from "@/services/media.dataProdecer/media.dataProducer.service";
import { MediaDataConsumerService } from "@/services/media.dataConsumer/media.dataConsumer.service";
import { MediaPlainTransportService } from '@/services/media.plain.transport/media.plain.transport.service';

@Module({
  controllers: [MediaRoomController],
  providers: [
    MediaRoomService,
    MediaRouterService,
    ProducerMediaWebRTCTransport,
    ConsumerMediaWebRTCTransport,
    MediaProducerService,
    MediaConsumerService,
    MediaDataProducerService,
    MediaDataConsumerService,
    MediaPlainTransportService
  ],
})
export class MediaRoomModule {}
