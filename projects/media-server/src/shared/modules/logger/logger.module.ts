import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { logger } from './logger';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      // 被调用 http 的日志输出
      pinoHttp: {
        logger: logger,
      },
      // exclude: [{ method: RequestMethod.ALL, path: 'health' }],
    }),
  ],
})
export class LoggerModule {}
