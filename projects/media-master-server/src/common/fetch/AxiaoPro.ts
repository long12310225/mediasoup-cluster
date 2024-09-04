import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as chalk from 'chalk';

class AxiosPro {
  private static _instance;
  private axiosInstance;
  
  constructor() {
    this.axiosInstance = axios.create();
    this.init();
    return this.axiosInstance;
  }

  public static getInstance() {
    try {
      if (!this._instance) {
        this._instance = new AxiosPro();
      }
      return this._instance;
    } catch (e) {
      console.log("请求异常, 请检查: ", "color:#3f7cff", e);
      return void 0
    }
  }

  private init() {
    // 可以不设定【默认】
    this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json';
    // 1分钟超时
    this.axiosInstance.defaults.timeout = 60000;
    this.requestInterceptor();
    this.responseInterceptor();
    this.axiosInstance.generatePath = this.generatePath
  }

  private requestInterceptor() {
    this.axiosInstance.interceptors.request.use(
      function (config: AxiosRequestConfig) {
        return config;
      },
      function (error: AxiosError) {
        return Promise.reject(error);
      },
    );
  }

  private responseInterceptor() {
    this.axiosInstance.interceptors.response.use(
      function (response: AxiosResponse) {
        // 状态 > 400 抛异常
        if (response.status > 400) {
          return JSON.stringify(response)
        } else {
          // 其余状态返回 data
          return response.data;
        }
      },
      async function (error: AxiosError) {
        // 响应异常
        if (error.isAxiosError) {
          console.warn(`${chalk.red(`服务异常, 请检查！！！`)}`);
          console.warn(`${chalk.red(`服务异常, 请检查！！！`)}`);
          console.warn(`${chalk.red(`服务异常, 请检查！！！`)}`);
          return void 0;
        } else {
          return Promise.reject(error);
        }
      },
    );
  }

  /**
   * 序列化 url
   * @param urlPattern
   * @param params
   * @returns
   */
  public generatePath(urlPattern: string, params: Record<string, any>) {
    const retParams = { ...params };
    const parts = urlPattern.split('/');
    const result = [] as string[];
    for (let i = 0; i < parts.length; i += 1) {
      if (parts[i].startsWith(':')) {
        const key = parts[i].slice(1);
        result.push(encodeURIComponent(params[key]));
        delete retParams[key];
      } else {
        result.push(parts[i]);
      }
    }
    return {
      path: result.join('/'),
      params: retParams,
    };
  }
}

export default AxiosPro.getInstance()
