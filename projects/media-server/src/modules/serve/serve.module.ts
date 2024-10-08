import { Module } from '@nestjs/common';
import { ServeService } from '@/services/serve/serve.service';
import { ServeController } from '@/controllers/serve/serve.controller';

@Module({
  controllers: [ServeController],
  providers: [ServeService],
  exports: [ServeService],
})
export class ServerModule {}
