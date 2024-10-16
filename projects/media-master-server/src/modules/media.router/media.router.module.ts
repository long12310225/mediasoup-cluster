import { Module } from '@nestjs/common';
import { MediaRouterController } from '../../controllers/media.router/media.router.controller';
import { MediaRouterService } from '../../services/media.router/media.router.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [MediaRouterController],
  providers: [MediaRouterService],
})
export class MediaRouterModule {}
