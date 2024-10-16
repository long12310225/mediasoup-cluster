import * as chalk from 'chalk';
import helmet from 'helmet';
import * as fs from 'fs';
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
import { loginnacos } from './nacos';

class Boot {
  // ipv4
  private ipv4 = internalIp.v4.sync();
  // 程序端口号
  private port = process.env.PORT;

  private static _instance = null;

  constructor() {
    loginnacos();
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
    const moduel =
      this.port == env.getEnv('SERVER_PORT') ? AppModule : SlaveModule;
    const httpsOptions = {
      cert: fs.readFileSync(`${__dirname}/config/certs/server.crt`),
      key: fs.readFileSync(`${__dirname}/config/certs/server.key`),
    };
    const app = await NestFactory.create<NestFastifyApplication>(
      moduel,
      new FastifyAdapter({
        https: httpsOptions,
      }),
    );

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

    await this.runHttpsServer(app, () => {
      // 配置初始化提示
      // const runningTips = this.initRunningTips(app);
      // console.log(runningTips);
    });

    // 将http服务升级为websocket服务
    this.port == env.getEnv('SERVER_PORT') && AppModule.runWSServer(app);
    
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
   * 配置跨域访问白名单
   */
  private initCorsWhiteList(app): void {
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
  private initRunningTips(app): string {
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
  // private initSwagger(app): boolean {
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

export const boot = Boot.getInstance()
