import { Module } from '@nestjs/common';
import { ServeService } from '../../services/serve/serve.service';

@Module({
  providers: [ServeService],
  exports: [ServeService]
})
export class ServeModule {}
