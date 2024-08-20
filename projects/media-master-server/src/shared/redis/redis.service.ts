import { Injectable, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import { Redis } from 'ioredis';
import { RedisClient } from './redis.interface';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,
  ) {}

  /**
   * 根据传入的 redis key 获取对应的 redis value
   * @param name key
   * @returns { Redis } 单个 Redis
   */
  getClient(name?: string): Redis {
    if (!name) {
      name = this.redisClient.defaultKey;
    }
    if (!this.redisClient.clients.has(name)) {
      throw new Error(`client ${name} does not exist`);
    }
    return this.redisClient.clients.get(name);
  }

  /**
   * 获取所有 clients
   * @returns { Map<string, Redis> }
   */
  getClients(): Map<string, Redis> {
    return this.redisClient.clients;
  }
}
