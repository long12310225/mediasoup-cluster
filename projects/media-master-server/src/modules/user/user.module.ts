import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '../../controllers/user/user.controller';
import { UserService } from '../../services/user/user.service';
import { MediaTransport } from '@/dao/transport/media.transport.do';
import { TransportService } from '@/services/transport/transport.service';
import { RouterService } from '../../services/router/router.service';
import { RoomService } from '../../services/room/room.service';
import { WorkerService } from '@/services/worker/worker.service';
import { MediaRouter } from '@/dao/router/media.router.do';
import { MediaRoom } from '@/dao/room/media.room.do';
import { MediaWorker } from '@/dao/worker/media.worker.do';
      
@Module({
  imports: [TypeOrmModule.forFeature([
    MediaTransport,
    MediaRouter,
    MediaRoom,
    MediaWorker
  ])],
  controllers: [UserController],
  providers: [UserService, TransportService, RouterService, RoomService, WorkerService],
})
export class UserModule {}
