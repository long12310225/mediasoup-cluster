import { Module } from '@nestjs/common';
import { MediaPlainTransportController } from '@/controllers/media.plain.transport/media.plain.transport.controller';
import { MediaPlainTransportService } from '@/services/media.plain.transport/media.plain.transport.service';
import { MediaRouterService } from '@/services/media.router/media.router.service';

@Module({
  controllers: [MediaPlainTransportController],
  providers: [MediaPlainTransportService, MediaRouterService],
})
export class MediaPlainTransportModule {}
