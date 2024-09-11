import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConsumerController } from '@/controllers/consumer/consumer.controller';
import { ConsumerService } from '@/services/consumer/consumer.service';
import { RouterService } from '@/services/router/router.service';
import { RoomService } from '@/services/room/room.service';
import { TransportService } from '@/services/transport/transport.service';
import { WorkerService } from '@/services/worker/worker.service';
import { PeerService } from '@/services/peer/peer.service';

import { MediaConsumer } from '@/dao/consumer/media.consumer.do';
import { MediaTransport } from '../../dao/transport/media.transport.do';
import { MediaWorker } from '../../dao/worker/media.worker.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaRoom } from '@/dao/room/media.room.do';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaConsumer,
      MediaTransport,
      MediaWorker,
      MediaRouter,
      MediaRoom,
    ]),
  ],
  controllers: [ConsumerController],
  providers: [
    ConsumerService,
    RouterService,
    RoomService,
    TransportService,
    WorkerService,
    PeerService,
  ],
})
export class ConsumerModule {}
