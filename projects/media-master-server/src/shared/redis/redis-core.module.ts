import {
  DynamicModule,
  Global,
  Module,
  Inject,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  createAsyncClientOptions,
  createClient,
} from './redis-client.provider';
import { REDIS_MODULE_OPTIONS, REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';
import { RedisModuleAsyncOptions, RedisModuleOptions, RedisClient } from './redis.interface';

// 全局模块
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisCoreModule implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_MODULE_OPTIONS)
    private readonly options: RedisModuleOptions | RedisModuleOptions[],
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClient,
  ) {}

  // 同步注册
  static forRoot(options: RedisModuleOptions | RedisModuleOptions[]): DynamicModule {
    return {
      module: RedisCoreModule, // 模块自身
      providers: [
        createClient(), // 自定义 Provider
        // 只要符合 Provider 格式的也可以传入
        {
          provide: REDIS_MODULE_OPTIONS, // 自己作为 provide 的name
          useValue: options // 注入的内容
        },
      ],
      exports: [RedisService],
    };
  }

  // 异步注册
  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: RedisCoreModule, // 模块自身
      imports: options.imports,
      providers: [
        createClient(), // 自定义Provider
        createAsyncClientOptions(options) // 给 options 提供一个可异步传入 useFactory 的执行函数
      ],
      exports: [RedisService],
    };
  }

  onModuleDestroy() {
    const closeConnection = ({ clients, defaultKey }) => (options) => {
      const name = options.name || defaultKey;
      const client = clients.get(name);

      if (client && !options.keepAlive) {
        client.disconnect();
      }
    };

    const closeClientConnection = closeConnection(this.redisClient);

    if (Array.isArray(this.options)) {
      this.options.forEach(closeClientConnection);
    } else {
      closeClientConnection(this.options);
    }
  }
}
