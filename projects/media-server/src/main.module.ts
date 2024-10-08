import { Module } from '@nestjs/common';
// import { APP_INTERCEPTOR } from '@nestjs/core';
// import { LogInterceptor } from './common/interceptors/log.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getSqlConfig, getRedisConfig } from './config/sql.config';
import { RoomModule } from './modules/room/room.module';
import { RouterModule } from './modules/router/router.module';
import { TransportModule } from './modules/transport/transport.module';
import { ProducerModule } from './modules/producer/producer.module';
import { ConsumerModule } from './modules/consumer/consumer.module'; 
import { WebSocketModule } from './modules/websocket/websocket.module';
import { UserModule } from './modules/user/user.module';
import { DataConsumerModule } from './modules/dataConsumer/dataConsumer.module';
import { DataProducerModule } from './modules/dataProducer/dataProducer.module';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { OpenTelemetryModule } from 'nestjs-otel';
import { PeerModule } from './modules/peer/peer.module';
import { WorkerModule } from './modules/worker/worker.module';
import { ServerModule } from './modules/serve/serve.module';
import { RedisModule } from 'nestjs-redis';
import { BroadcasterModule } from './modules/broadcaster/broadcaster.module';
import { LoggerModule } from '@/shared/modules/logger';
import { AxiosModule } from '@/shared/modules/axios';

@Module({
  imports: [
    AxiosModule.forRoot({}),
    OpenTelemetryModule.forRoot({
      metrics: {
        hostMetrics: true,
        apiMetrics: {
          enable: true,
        },
      },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => getSqlConfig(),
    }),
    RedisModule.forRootAsync({
      useFactory: () => getRedisConfig(),
    }),
    TypeOrmModule.forFeature([MediaWorker]),
    ServerModule,
    LoggerModule,
    RoomModule,
    RouterModule,
    TransportModule,
    ProducerModule,
    ConsumerModule,
    UserModule,
    WebSocketModule,
    DataConsumerModule,
    DataProducerModule,
    PeerModule,
    WorkerModule,
    BroadcasterModule
  ],
  // providers: [
  //   {
  //     provide: APP_INTERCEPTOR,
  //     useClass: LogInterceptor,
  //   },
  // ],
})
export class MainModule {}
