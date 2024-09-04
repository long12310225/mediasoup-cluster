import * as Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Provider } from '@nestjs/common';
import { REDIS_CLIENT, REDIS_MODULE_OPTIONS } from './redis.constants';
import { RedisModuleAsyncOptions, RedisModuleOptions, RedisClient } from './redis.interface';
import { RedisPro } from './RedisPro';

/**
 * 创建 redis 实例
 * @param { RedisModuleOptions } options 连接 redis 的同步 options 对象
 * @returns 
 */
const createRedis = async (options: RedisModuleOptions): Promise<Redis.Redis> => {
  const { onClientReady, url, ...opt } = options;
  // 创建 redis 实例
  const client = url ? new RedisPro(url) : new RedisPro(opt);
  if (onClientReady) {
    onClientReady(client)
  }
  return client;
}

/**
 * 声明 Provider 函数，用于创建 redis 实例
 * @returns { Provider } 返回 nestjs Provider
 */
export const createClient = (): Provider => ({
  // 声明 provide 的 name
  provide: REDIS_CLIENT,
  /**
   * @param options 同 inject 中获取到的 options
   * @returns { Promise } 
   */
  useFactory: async (options: RedisModuleOptions | RedisModuleOptions[]): Promise<RedisClient> => {
    const clients = new Map<string, Redis.Redis>();
    let defaultKey = uuidv4();
    // 判断传入的 options 类型
    // 如果是数组对象类型（多连接时使用）
    if (Array.isArray(options)) {
      await Promise.all(
        options.map(async o => {
          // 如果有传入 options.name 作为key，否则就用 uuid 作为 key
          const key = o.name || defaultKey;
          if (clients.has(key)) {
            throw new Error(`${o.name || 'default'} client is exists`);
          }
          clients.set(key, await createRedis(o));
        }),
      );
    } 
    // 其余当作是单对象类型处理
    else {
      if (options.name && options.name.length !== 0) {
        defaultKey = options.name;
      }
      // 如果有传入 options.name 作为key，否则就用 uuid 作为 key
      clients.set(defaultKey, await createRedis(options));
    }

    return {
      defaultKey,
      clients,
      size: clients.size,
    };
  },
  // 被注入的内容的 name
  inject: [REDIS_MODULE_OPTIONS],
});

/**
 * 创建异步 redis 实例 options
 * @param { RedisModuleAsyncOptions } options 连接 redis 的异步 options 对象
 * @returns 
 */
export const createAsyncClientOptions = (options: RedisModuleAsyncOptions) => ({
  // 声明 provide 的 name
  provide: REDIS_MODULE_OPTIONS, 
  // 异步调用方式，需要使用者自行传入 useFactory 函数
  useFactory: options.useFactory, 
  // 需要使用者自行传入被注入的 name
  inject: options.inject, 
});
