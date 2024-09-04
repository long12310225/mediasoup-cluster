import { Module } from '@nestjs/common';
// import { APP_INTERCEPTOR } from '@nestjs/core';
// import { LogInterceptor } from './common/interceptors/log.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqlConfig, redisConfig } from './config/sql.config'
import { MediaRoomModule } from './modules/media.room/media.room.module';
import { MediaRouterModule } from './modules/media.router/media.router.module';
import { MediaWebRTCTransportModule } from './modules/media.webrtc.transport/media.webrtc.transport.module';
import { MediaProducerModule } from './modules/media.producer/media.producer.module';
import { MediaConsumerModule } from './modules/media.consumer/media.consumer.module';
import { MediaPipeTransportModule } from './modules/media.pipe.transport/media.pipe.transpor.module';
import { MediaDataProducerModule } from './modules/media.dataProdecer/media.dataProdecer.module';
import { WorkerService } from './services/worker/worker.service';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { MediaDataConsumerModule } from './modules/media.dataConsumer/media.dataConsumer.module';
import { MediaPlainTransportModule } from './modules/media.plain.transport/media.plain.transport.module'; 
import { OpenTelemetryModule } from 'nestjs-otel';
import { LoggerModule } from './shared/modules/logger/logger.module';
import { RedisModule } from 'nestjs-redis';
import { AxiosModule } from '@/shared/modules/axios';

@Module({
  imports: [
    AxiosModule.forRoot({}),
    RedisModule.forRoot(redisConfig),
    OpenTelemetryModule.forRoot({
      metrics: {
        hostMetrics: true,
        apiMetrics: {
          enable: true,
        },
      },
    }),
    TypeOrmModule.forRoot(sqlConfig),
    TypeOrmModule.forFeature([MediaWorker]),
    LoggerModule,
    MediaRoomModule,
    MediaRouterModule,
    MediaWebRTCTransportModule,
    MediaProducerModule,
    MediaConsumerModule,
    MediaPipeTransportModule,
    MediaDataProducerModule,
    MediaDataConsumerModule,
    MediaPlainTransportModule
  ],
  providers: [
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: LogInterceptor,
    // },
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
