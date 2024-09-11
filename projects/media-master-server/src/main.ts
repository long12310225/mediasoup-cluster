import * as chalk from 'chalk';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { corsWhiteList } from '@/config/hosts';
import env from '@/config/env';
import * as internalIp from 'internal-ip';
import { AppModule } from './app.module';
import { SlaveModule } from './slave.module';
import {Logger} from './shared/lib/Logger';
import {Room} from './shared/lib/Room';
import fs from 'fs';
import config from './shared/lib/config';
import https from 'https';
import express from 'express';
import otelSDK from './instrumentation';
const logger=new Logger();
class Boot {
  // ipv4
  private static ipv4 = internalIp.v4.sync();
  // 程序端口号
  private static port = process.env.PORT

  private static httpsServer;
  private static expressApp;
  private static protooWebSocketServer;
  private static mediasoupWorkers;
  private static nextMediasoupWorkerIdx;
  /**
   * 启动函数
   */
  public static async init(): Promise<void> {
    await otelSDK.start();

    const moduel = Boot.port == env.getEnv('SERVER_PORT') ? AppModule : SlaveModule;
    // const app = await NestFactory.create(moduel);
    const app = await NestFactory.create<NestFastifyApplication>(moduel, new FastifyAdapter());
    
    app.useLogger(app.get(Logger));
    
    this.initCorsWhiteList(app);

    // 需要 api 前缀可以打开使用
    // app.setGlobalPrefix('api');

    app.use(
      helmet({
        contentSecurityPolicy: false,
      }),
    );

    // 全局过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    // 全局管道
    // app.useGlobalPipes(new ValidationPipe());

    await app.listen(this.port, '0.0.0.0', () => {
      // 配置初始化提示
      const runningTips = this.initRunningTips(app);
      console.log(runningTips);
      //初始化websocket

    });
  }

  private static async runHttpsServer()
  {
    logger.info('running an HTTPS server...');

    // HTTPS server for the protoo WebSocket server.
    const tls =
    {
      cert : fs.readFileSync(config.https.tls.cert),
      key  : fs.readFileSync(config.https.tls.key)
    };

    Boot.httpsServer = https.createServer(tls, Boot.expressApp);

    await new Promise((resolve) =>
    {
      Boot.httpsServer.listen(
        Number(config.https.listenPort), config.https.listenIp, resolve);
    });
  }

  /**
   * 配置跨域访问白名单
   */
  private static initCorsWhiteList(app): void {
    // 处理跨域，需要配置访问白名单
    const corsOptions = {
      origin: function (origin, callback) {
        // 本机请求未跨域origin不存在
        if (!origin || corsWhiteList.some((x) => origin.indexOf(x) > -1)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      // credentials: true,
    };
    app.enableCors(corsOptions);
  }

  /**
   * 初始化提示
   */
  private static initRunningTips(app): string {
    let runningTips = `App running at:
      - Local:   ${chalk.green(`http://localhost:${this.port}/`)}
      - Network: ${chalk.green(`http://${this.ipv4}:${this.port}/`)}`;

    // 开发环境才输出文档
    // if (env.getEnv('PRO_DOC') && this.initSwagger(app)) {
    //   const docTips = `\nDocs running at:
    //   - Local:   ${chalk.green(`http://localhost:${this.port}/docs/`)}
    //   - Network: ${chalk.green(`http://${this.ipv4}:${this.port}/docs/`)}`;
    //   runningTips = runningTips + docTips;
    // }

    return runningTips;
  }

  /**
   * 配置swagger
   */
  // private static initSwagger(app): boolean {
  //   const options = new DocumentBuilder()
  //     .setTitle('api 接口文档')
  //     .setVersion('1.0.0')
  //     .addBearerAuth()
  //     .build();
  //   const document = SwaggerModule.createDocument(app, options);
  //   SwaggerModule.setup('/docs', app, document);
  //   return true;
  // }
}

Boot.init();
