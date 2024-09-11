import { Module } from '@nestjs/common';
import { MediaPipeTransportController } from '@/controllers/media.pipe.transport/media.pipe.transport.controller';
import { MediaPipeTransportService } from '@/services/media.pipe.transport/media.pipe.transport.service';
import { MediaRouterService } from '@/services/media.router/media.router.service';

@Module({
  controllers: [MediaPipeTransportController],
  providers: [MediaPipeTransportService, MediaRouterService],
})
export class MediaPipeTransportModule {}
