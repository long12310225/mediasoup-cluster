import { DynamicModule, Module } from '@nestjs/common';
import { RedisModuleAsyncOptions, RedisModuleOptions } from './redis.interface';
import { RedisCoreModule } from './redis-core.module';

@Module({})
export class RedisModule {
  /**
   * 同步注册 redis
   * @param { RedisModuleOptions } options 根据 'ioredis' RedisOptions 拓展的 options
   * @returns 
   */
  static forRoot(options: RedisModuleOptions | RedisModuleOptions[]): DynamicModule {
    return {
      module: RedisModule, // 模块自身
      imports: [
        // 传入 RedisCoreModule.register 返回的自定义模块
        RedisCoreModule.forRoot(options)
      ],
    };
  }

  // 异步注册
  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: RedisModule, // 模块自身
      imports: [
        // 传入 RedisCoreModule.forRootAsync 返回的自定义模块
        RedisCoreModule.forRootAsync(options)
      ],
    };
  }
}
