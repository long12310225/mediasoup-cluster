import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProducerController } from '@/controllers/producer/producer.controller';
import { ProducerService } from '@/services/producer/producer.service';
import { RouterService } from '@/services/router/router.service';
import { RoomService } from '@/services/room/room.service';
import { TransportService } from '@/services/transport/transport.service';
import { WorkerService } from '@/services/worker/worker.service';
import { PeerService } from '@/services/peer/peer.service';

import { MediaProducer } from '@/dao/producer/media.producer.do';
import { MediaTransport } from '../../dao/transport/media.transport.do';
import { MediaWorker } from '../../dao/worker/media.worker.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaRoom } from '@/dao/room/media.room.do';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaProducer,
      MediaTransport,
      MediaWorker,
      MediaRouter,
      MediaRoom,
    ]),
  ],
  controllers: [ProducerController],
  providers: [
    ProducerService,
    RouterService,
    RoomService,
    TransportService,
    WorkerService,
    PeerService,
  ],
})
export class ProducerModule {}
