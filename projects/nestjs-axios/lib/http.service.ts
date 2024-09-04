import { Inject } from '@nestjs/common';
import Axios, {
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
} from 'axios';
import { Observable } from 'rxjs';
import { AXIOS_INSTANCE_TOKEN } from './http.constants';

export class HttpService {
  constructor(
    // 将 axios 实例注入
    @Inject(AXIOS_INSTANCE_TOKEN)
    protected readonly instance: AxiosInstance = Axios,
  ) {}

  request<T = any>(
    config: AxiosRequestConfig
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.request, config);
  }

  get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.get, url, config);
  }

  delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.delete, url, config);
  }

  head<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.head, url, config);
  }

  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.post, url, data, config);
  }

  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.put, url, data, config);
  }

  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.patch, url, data, config);
  }

  get axiosRef(): AxiosInstance {
    return this.instance;
  }

  /**
   * 
   * @param axios axios实例方法
   * @param args 实例方法相关的参数，使用rest语法接收
   * @returns 
   */
  protected makeObservable<T>(
    axios: (...args: any[]) => AxiosPromise<T>,
    ...args: any[]
  ) {
    /**
     * 返回一个响应式AxiosResponse对象
     * Observable 构造函数接收一个回调函数
     * 
     * https://www.npmjs.com/package/rxjs?activeTab=code
     */
    return new Observable<AxiosResponse<T>>((subscriber) => {
      // 将接收的参数数组转为对象
      const config: AxiosRequestConfig = { ...(args[args.length - 1] || {}) };

      // 处理中断请求
      let cancelSource: CancelTokenSource;
      if (!config.cancelToken) {
        cancelSource = Axios.CancelToken.source();
        config.cancelToken = cancelSource.token;
      }

      // axios实例方法被调用
      axios(...args)
        .then(res => {
          // 将 axios 实例方法的调用结果，传递下去
          subscriber.next(res);
          subscriber.complete();
        })
        // 捕捉异常向下传递
        .catch(err => {
          subscriber.error(err);
        });
      
      // 返回一个函数
      return () => {
        if (config.responseType === 'stream') {
          return;
        }
        // 中断请求
        if (cancelSource) {
          cancelSource.cancel();
        }
      };
    });
  }
}
