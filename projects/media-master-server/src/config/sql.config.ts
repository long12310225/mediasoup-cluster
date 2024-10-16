import env from '@/config/env';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const sqlConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: env.getEnv('DB_HOST'),
  port: env.getEnv('DB_PORT'),
  username: env.getEnv('DB_USER'),
  password: String(env.getEnv('DB_PASSWORD')),
  database: env.getEnv('DB_DATABASE',),
  synchronize: env.getEnv('DB_TABLE_SYNC'),
  entities: ['dist/**/*.do.js'],
  logging: false,
  extra: {
    charset: 'utf8mb4_general_ci',
  },
}