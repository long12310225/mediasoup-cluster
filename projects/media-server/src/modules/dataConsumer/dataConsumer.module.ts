import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataConsumerService } from '@/services/dataConsumer/dataConsumer.service';
import { RouterService } from '@/services/router/router.service';
import { RoomService } from '@/services/room/room.service';
import { TransportService } from '@/services/transport/transport.service';
import { WorkerService } from '@/services/worker/worker.service';
import { PeerService } from '@/services/peer/peer.service';

import { MediaDataConsumer } from '@/dao/dataConsumer/media.dataConsumer.do';
import { MediaTransport } from '@/dao/transport/media.transport.do';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaRoom } from '@/dao/room/media.room.do';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaDataConsumer,
      MediaTransport,
      MediaWorker,
      MediaRouter,
      MediaRoom,
    ]),
  ],
  providers: [
    DataConsumerService,
    RouterService,
    RoomService,
    TransportService,
    WorkerService,
    PeerService,
  ],
})
export class DataConsumerModule {}
