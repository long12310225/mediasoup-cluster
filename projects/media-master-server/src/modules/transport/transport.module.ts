import { Module } from '@nestjs/common';
import { TransportController } from '../../controllers/transport/transport.controller';
import { TransportService } from '../../services/transport/transport.service';
import { RouterService } from '../../services/router/router.service'
import { WorkerService } from '../../services/worker/worker.service';
import { RoomService } from '../../services/room/room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaTransport } from '../../dao/transport/media.transport.do';
import { MediaWorker } from '../../dao/worker/media.worker.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaRoom } from '@/dao/room/media.room.do';

@Module({
  imports: [TypeOrmModule.forFeature([
    MediaWorker,
    MediaRouter,
    MediaTransport,
    MediaRoom
  ])],
  controllers: [TransportController],
  providers: [TransportService, RouterService, WorkerService, RoomService],
})
export class TransportModule {}
