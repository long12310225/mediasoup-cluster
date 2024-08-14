import { Module } from '@nestjs/common';
import { RouterController } from '../../controllers/router/router.controller';
import { RouterService } from '../../services/router/router.service';
import { WorkerService } from '../../services/worker/worker.service';
import { RoomService } from '@/services/room/room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaRoom } from '@/dao/room/media.room.do';

@Module({
  imports: [TypeOrmModule.forFeature([
    MediaWorker,
    MediaRouter,
    MediaRoom
  ])],
  controllers: [RouterController],
  providers: [RouterService, WorkerService, RoomService],
})
export class RouterModule {}
