import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MediaWorker } from '@/dao/worker/media.worker.do';
import { MediaRoom } from '@/dao/room/media.room.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { Peer } from '@/dao/peer/peer.do';

import { WebSocketController } from '@/controllers/websocket/websocket.controller';

import { WebSocketService } from '../../services/websocket/websocket.service';
import { RoomService } from '@/services/room/room.service';
import { WorkerService } from '../../services/worker/worker.service';
import { RouterService } from '@/services/router/router.service';
import { TransportService } from '@/services/transport/transport.service';
import { ConsumerService } from '@/services/consumer/consumer.service'; 
import { ProducerService } from '@/services/producer/producer.service';
import { DataProducerService } from '@/services/dataProducer/dataProducer.service';
import { DataConsumerService } from '@/services/dataConsumer/dataConsumer.service';
import { PeerService } from '@/services/peer/peer.service'; 

@Module({
  imports: [TypeOrmModule.forFeature([
    MediaWorker,
    MediaRoom,
    MediaRouter,
    Peer
  ])],
  controllers: [WebSocketController],
  providers: [
    WebSocketService,
    WorkerService,
    RoomService,
    RouterService,
    TransportService,
    ConsumerService,
    ProducerService,
    DataProducerService,
    DataConsumerService,
    PeerService
  ],
  exports: [WebSocketService]
})
export class WebSocketModule {}
