import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportController } from '../../controllers/transport/transport.controller';
import { TransportService } from '../../services/transport/transport.service';
import { RouterService } from '../../services/router/router.service';
import { WorkerService } from '../../services/worker/worker.service';
import { RoomService } from '../../services/room/room.service';
import { PeerService } from '../../services/peer/peer.service';
import { MediaTransport } from '../../dao/transport/media.transport.do';
import { MediaWorker } from '../../dao/worker/media.worker.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaRoom } from '@/dao/room/media.room.do';
import { Peer } from '@/dao/peer/peer.do';
import { PeerModule } from '../peer/peer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaWorker,
      MediaRouter,
      MediaTransport,
      MediaRoom,
      Peer,
    ]),
    PeerModule
  ],
  controllers: [TransportController],
  providers: [
    TransportService,
    RouterService,
    WorkerService,
    RoomService,
    PeerService,
  ],
})
export class TransportModule {}
