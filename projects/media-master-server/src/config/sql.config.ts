import env from '@/config/env';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RedisModuleOptions } from 'nestjs-redis';
import { RedisOptions } from 'ioredis';

export const sqlConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: env.getEnv('DB_HOST'),
  port: env.getEnv('DB_PORT'),
  username: env.getEnv('DB_USER'),
  password: String(env.getEnv('DB_PASSWORD')),
  database: env.getEnv('DB_DATABASE'),
  synchronize: env.getEnv('DB_TABLE_SYNC'),
  entities: ['dist/**/*.do.js'],
  logging: env.getEnv('DB_LOGGING'),
  extra: {
    charset: 'utf8mb4_general_ci',
  },
  cache: {
    type: "ioredis",
    options: {
      port: env.getEnv('REDIS_PORT'),
      host: env.getEnv('REDIS_HOST'),
      password: String(env.getEnv('REDIS_PASSWORD')),
      db: 1,
    }
  }
}

export const redisConfig = <RedisOptions>{
  port: env.getEnv('REDIS_PORT'),
  host: env.getEnv('REDIS_HOST'),
  password: String(env.getEnv('REDIS_PASSWORD')),
  db: env.getEnv('REDIS_DB'),
}
