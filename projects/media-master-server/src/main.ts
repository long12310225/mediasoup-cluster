import * as chalk from 'chalk';
import helmet from 'helmet';
import * as fs from 'fs';
import { otelSDK } from './shared/tracing';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// import { ValidationPipe } from './common/pipes/validation.pipe';
import env from '@/config/env';
import { MainModule } from './main.module';
import { SlaveModule } from './slave.module';
import { loginnacos } from './shared/nacos';
import { WebSocketService } from './services/websocket/websocket.service';
import { Logger } from 'nestjs-pino';

class Boot {
  // 程序端口号
  private port = process.env.PORT;

  private static _instance = null;

  constructor() {
    // loginnacos();
    this.init();
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new Boot();
    }
    return this._instance;
  }

  /**
   * 启动函数
   */
  public async init(): Promise<any> {
    await otelSDK.start();

    const moduel =
      this.port == env.getEnv('SERVER_PORT_MAIN') ? MainModule : SlaveModule;
    const httpsOptions = {
      cert: fs.readFileSync(`src/config/certs/server.crt`),
      key: fs.readFileSync(`src/config/certs/server.key`),
    };
    const app = await NestFactory.create<NestFastifyApplication>(
      moduel,
      new FastifyAdapter({
        https: httpsOptions,
      }),
    );

    // 使用 pino logger 重置 nestjs 默认 Logger 模块
    app.useLogger(app.get(Logger));

    app.use(
      helmet({
        contentSecurityPolicy: false,
      }),
    );

    // 全局过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    // 全局管道
    // app.useGlobalPipes(new ValidationPipe());

    await this.runHttpsServer(app, () => {
      // 配置初始化提示
      const runningTips = this.initRunningTips(app);
      console.log(runningTips);
    });

    // 将http服务升级为websocket服务
    this.port == env.getEnv('SERVER_PORT_MAIN') && app.select(MainModule).get(WebSocketService).runWSServer(app);
  }

  /**
   * 创建http服务
   */
  private async runHttpsServer(app, fn) {
    return app.listen(this.port, env.getEnv('SERVER_IP'), () => {
      typeof fn === 'function' && fn();
    });
  }

  /**
   * 初始化提示
   */
  private initRunningTips(app): string {
    let runningTips = `App running at:
      - Network: ${chalk.green(`https://${env.getEnv('SERVER_IP')}:${env.getEnv('SERVER_PORT')}/`)}`;

    return runningTips;
  }
 
}

Boot.getInstance()
