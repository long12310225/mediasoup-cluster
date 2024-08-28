import { ModuleMetadata } from '@nestjs/common/interfaces';
import { Redis, RedisOptions } from 'ioredis';

/**
 * @extends { RedisOptions } 类型拓展
 * file://./README.md
 */
export interface RedisModuleOptions extends RedisOptions {
  // redis name
  name?: string;
  url?: string;
  onClientReady?(client: Redis): void;
}

export interface RedisModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (
    ...args: any[]
  ) =>
    | RedisModuleOptions
    | RedisModuleOptions[]
    | Promise<RedisModuleOptions>
    | Promise<RedisModuleOptions[]>;
  inject?: any[];
}

/**
 * RedisClient 类型
 */
export interface RedisClient {
  defaultKey: string;
  clients: Map<string, Redis>;
  size: number;
}
