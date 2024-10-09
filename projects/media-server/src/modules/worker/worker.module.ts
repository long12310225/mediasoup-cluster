import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerController } from '../../controllers/worker/worker.controller';
import { WorkerService } from '../../services/worker/worker.service';
import { MediaWorker } from '@/dao/worker/media.worker.do';

@Module({
  imports: [TypeOrmModule.forFeature([MediaWorker])],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
