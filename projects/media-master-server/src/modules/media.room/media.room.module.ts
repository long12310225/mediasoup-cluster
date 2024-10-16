import { Module } from '@nestjs/common';
import { MediaRoomController } from '../../controllers/media.room/media.room.controller';
import { MediaRoomService } from '../../services/media.room/media.room.service';
import { MediaRouterService } from '../../services/media.router/media.router.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [MediaRoomController],
  providers: [MediaRoomService, MediaRouterService],
})
export class MediaRoomModule {}
