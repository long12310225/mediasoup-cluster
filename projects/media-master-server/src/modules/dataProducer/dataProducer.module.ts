import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataProducerService } from '@/services/dataProducer/dataProducer.service';
import { RouterService } from '@/services/router/router.service';
import { RoomService } from '@/services/room/room.service';
import { TransportService } from '@/services/transport/transport.service';
import { WorkerService } from '@/services/worker/worker.service';
import { PeerService } from '@/services/peer/peer.service';

import { MediaDataProducer } from '@/dao/dataProducer/media.dataProducer.do';
import { MediaTransport } from '@/dao/transport/media.transport.do';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaRoom } from '@/dao/room/media.room.do';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaDataProducer,
      MediaTransport,
      MediaWorker,
      MediaRouter,
      MediaRoom,
    ]),
  ],
  providers: [
    DataProducerService,
    RouterService,
    RoomService,
    TransportService,
    WorkerService,
    PeerService,
  ],
})
export class DataProducerModule {}
