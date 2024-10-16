import * as chalk from 'chalk';
import helmet from 'helmet';
import * as fs from 'fs';
import { startOtel, startSkywalking } from './common/tracing';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
// import { ValidationPipe } from './common/pipes/validation.pipe';
import env from '@/config/env';
import { MainModule } from './main.module';
import { SlaveModule } from './slave.module';
import { registryNacos, getNacosConfig } from './common/nacos';
import { WebSocketService } from './services/websocket/websocket.service';
import { Logger } from 'nestjs-pino';
import { CONSTANTS } from '@/common/enum';

class Boot {
  // 程序端口号
  private port = process.env.PORT || env.getEnv('SERVER_PORT');

  private static _instance = null;

  constructor() {
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
    registryNacos();
    const confit = await getNacosConfig()
    env.addEnvConfig(confit)
    
    startSkywalking();
    await startOtel();

    let module
    if (process.env.NODE_ENV !== 'dev' && env.getEnv('SERVER_TYPE')) {
      module = CONSTANTS.MAIN === env.getEnv('SERVER_TYPE') ? MainModule : SlaveModule;
    } else {
      console.log(`${chalk.bgGreenBright(`运行本地环境`)}`)
      module = this.port == env.getEnv('SERVER_PORT_MAIN') ? MainModule : SlaveModule;
    }
    
    const httpsOptions = {
      cert: fs.readFileSync(`certs/${env.getEnv('SERVER_CERT')}`),
      key: fs.readFileSync(`certs/${env.getEnv('SERVER_KEY')}`),
    };
    const app = await NestFactory.create<NestFastifyApplication>(
      module,
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
    let runningTips = `${chalk.bgBlueBright(`App running at: 
      - Network: https://${env.getEnv('SERVER_IP')}:${this.port}/`)}`;

    return runningTips;
  }
 
}

Boot.getInstance()
