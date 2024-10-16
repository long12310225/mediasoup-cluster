import { Module } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogInterceptor } from './common/interceptors/log.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqlConfig } from './config/sql.config'
import { RoomModule } from './modules/room/room.module';
import { RouterModule } from './modules/router/router.module';
import { TransportModule } from './modules/transport/transport.module';
import { ProducerModule } from './modules/producer/producer.module';
import { ConsumerModule } from './modules/consumer/consumer.module'; 
import { UserModule } from './modules/user/user.module';
import { RoomService } from './services/room/room.service';
import { WorkerService } from './services/worker/worker.service';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import protoo from '@/shared/protoo-server';
import * as url from 'url';
import { AwaitQueue } from 'awaitqueue';
import env from '@/config/env'

@Module({
  imports: [
    TypeOrmModule.forRoot(sqlConfig),
    TypeOrmModule.forFeature([MediaWorker]),
    RoomModule,
    RouterModule,
    TransportModule,
    ProducerModule,
    ConsumerModule,
    UserModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
    WorkerService
  ],
})
export class AppModule {
  private static queue = new AwaitQueue();

  constructor(
    private readonly workerService: WorkerService
  ) {
    this.workerService.init();
  }

  public static runWSServer(appInstance: NestFastifyApplication) { 
    AppModule.runProtooWebSocketServer(appInstance.getHttpServer());
  }
  
  /**
   * 创建ws连接
   */
  private static runProtooWebSocketServer(httpsServer) {
    console.info('running protoo WebSocketServer...');

    // Create the protoo WebSocket server.
    const protooWebSocketServer = new protoo.WebSocketServer(httpsServer, {
      maxReceivedFrameSize: 960000, // 960 KBytes.
      maxReceivedMessageSize: 960000,
      fragmentOutgoingMessages: true,
      fragmentationThreshold: 960000,
    });

    // 触发连接时执行
    protooWebSocketServer.on(
      'connectionrequest',
      (
        info,
        accept,
        reject, // connectionrequest这个是protoo.WebSocketServer的监听事件
      ) => {
        // The client indicates the roomId and peerId in the URL query.
        const u = url.parse(info.request.url, true); // 解析ws的url
        const roomId = u.query['roomId'];
        const peerId = u.query['peerId'];
        console.log("%c Line:78 🥔 roomId peerId", "color:#7f2b82", roomId, peerId);

        if (!roomId || !peerId) {
          reject(400, 'Connection request without roomId and/or peerId');
          return;
        }

        this.queue.push(async () => {
          console.log("%c Line:93 🍺🍺", "color:#ea7e5c");
          // 返回 WebSocketTransport 对象（内置：WebSocketConnection实例），用于传递给 Peer 内使用
          const protooWebSocketTransport = accept();

          // 创建 room（含 mediasoup router）
          const room = await RoomService.createRoom({ roomId });
          room.handleProtooConnection({
            peerId,
            protooWebSocketTransport
          })
          
        }).catch((error) => {
          console.error('room creation or room joining failed:%o', error);
          reject(error);
        });
      },
    );
  }
}


