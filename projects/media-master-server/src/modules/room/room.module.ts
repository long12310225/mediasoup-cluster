import { Module } from '@nestjs/common';
import { RoomController } from '../../controllers/room/room.controller';
import { RoomService } from '../../services/room/room.service';
import { WorkerService } from '../../services/worker/worker.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaRoom } from '@/dao/room/media.room.do';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { MediaRouter } from '@/dao/router/media.router.do';

@Module({
  imports: [TypeOrmModule.forFeature([
    MediaRoom,
    MediaWorker,
    MediaRouter
  ])],
  controllers: [RoomController],
  providers: [RoomService, WorkerService],
  exports: [RoomService]
})
export class RoomModule {}
