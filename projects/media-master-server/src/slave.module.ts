import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogInterceptor } from './common/interceptors/log.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqlConfig } from './config/sql.config'
import { MediaRoomModule } from './modules/media.room/media.room.module';
import { MediaRouterModule } from './modules/media.router/media.router.module';
import { MediaWebRTCTransportModule } from './modules/media.webrtc.transport/media.webrtc.transport.module';
import { MediaProducerModule } from './modules/media.producer/media.producer.module';
import { MediaConsumerModule } from './modules/media.consumer/media.consumer.module';
import { MediaPipeTransportModule } from './modules/media.pipe.transport/media.pipe.transpor.module';
import { WorkerService } from './services/worker/worker.service';
import { MediaWorker } from '@/dao/worker/media.worker.do';

@Module({
  imports: [
    TypeOrmModule.forRoot(sqlConfig),
    TypeOrmModule.forFeature([MediaWorker]),
    MediaRoomModule,
    MediaRouterModule,
    MediaWebRTCTransportModule,
    MediaProducerModule,
    MediaConsumerModule,
    MediaPipeTransportModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
    WorkerService,
  ],
})
export class SlaveModule {
  constructor(
    private readonly workerService: WorkerService
  ) {
    this.workerService.init();
  }
}
