import { logger } from './../logger/logger';
import { Injectable } from '@nestjs/common';
import { Method } from 'axios';
import * as https from 'https';
import { generatePath } from './utils';
import env from '../../../config/env';
import {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError
} from 'axios';
import { HttpService } from 'nestjs-axios';
import * as chalk from 'chalk';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AxiosService {
  // 创建一个配置了TLS选项的Agent
  private httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  constructor(
    private readonly logger: PinoLogger,
    protected readonly httpService: HttpService
  ) { 
    this.logger.setContext(AxiosService.name)
    this.init();
  }

  private init() {
    // 可以不设定【默认】
    this.httpService.axiosRef.defaults.headers.post['Content-Type'] = 'application/json';
    // 1分钟超时
    this.httpService.axiosRef.defaults.timeout = 60000;
    this.requestInterceptor();
    this.responseInterceptor();
  }
  
  private requestInterceptor() {
    this.httpService.axiosRef.interceptors.request.use(
      function (config: AxiosRequestConfig) {
        return config;
      },
      function (error: AxiosError) {
        return Promise.reject(error);
      },
    );
  }

  private responseInterceptor() {
    this.httpService.axiosRef.interceptors.response.use(
      function (response: AxiosResponse) {
        // 状态 > 400 抛异常
        if (response.status > 400) {
          return JSON.stringify(response)
        } else {
          // 其余状态返回 data
          return response.data;
        }
      },
      async function (error) {
        // 响应异常
        if (error.isAxiosError) {
          if (error?.address && error?.port) {
            // this.logger.error(`${error?.address}:${error?.port} 服务异常, 请检查！！！`)
            console.log(`${chalk.red(`${error?.address}:${error?.port} 服务异常, 请检查！！！`)}`);
            
            const workerList = (await MediaWorker.getRepository().findBy({
              apiHost: error.address,
              apiPort: error.port
            })).map((item) => {
              return {
                ...item,
                isAliveServe: 0
              }
            })
            await MediaWorker.getRepository().save(workerList)
          }

          return void 0;
        } else {
          return Promise.reject(error);
        }
      },
    );
  }

  public fetchApi({
    host,
    port,
    path,
    method,
    data,
  }: {
    host: string;
    port?: string | number;
    path: string;
    method: Method;
    data?: Record<string, any>;
  }): any {
    try {
      const parsed = generatePath(path, data || {});
      let body;
      if (method === 'GET') {
        parsed.path += '?' + new URLSearchParams(parsed.params);
      } else {
        body = data;
      }
      // 拼接url
      const url = 'https://' + host + (port ? ':' + port : '') + parsed.path;

      return this.httpService.axiosRef({
        url,
        method,
        data: body,
        httpsAgent: this.httpsAgent,
      });

    } catch (error) {
      console.log('请求异常, 请检查: ', error);
      return void 0;
    }
  }

  public fetchApiMaster({ path, method, data }) {
    return this.fetchApi({
      host: env.getEnv('SERVER_IP_MAIN'),
      port: env.getEnv('SERVER_PORT_MAIN'),
      path,
      method,
      data,
    });
  }
}
