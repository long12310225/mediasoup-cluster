import Pino, { Logger, LoggerOptions } from 'pino';
import { trace, context } from '@opentelemetry/api';
import { getCurrentDateTime } from '@/common/utils';
// const pinoElasticSearch = require('pino-elasticsearch');

let loggerOptions: LoggerOptions = {
  level: 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
    // Workaround for PinoInstrumentation (does not support latest version yet)
    log(object) {
      // 获取span
      const span = trace.getSpan(context.active());
      // 没有span，直接返回
      if (!span) {
        return { ...object };
      }

      const { spanId, traceId } = trace.getSpan(context.active())?.spanContext();
      // 打印格式
      return {
        ...object,
        spanId,
        traceId,
        span_id: spanId,
        trace_id: traceId,
      };
    },
  },
  timestamp: () => `,"time":"${getCurrentDateTime()}"`,
};

if (process.env.NODE_ENV === 'dev') {
  // 开发环境才可以开启
  Object.assign(loggerOptions, {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  })
}

// 上报至ElasticSearch
// const streamToElastic = pinoElasticSearch({
//   index: 'nestlogs', 
//   node: 'http://10.2.30.31:9200',
//   esVersion: 7, // Elasticsearch 版本
//   flushBytes: 1000
// })

// export const logger: Logger = Pino(loggerOptions, streamToElastic)
export const logger: Logger = Pino(loggerOptions)
  // .child({
  //   file: {
  //     line: new Error().stack.split('\n')[2].trim().split(' ')[1], // 获取当前行数
  //   },
  // });
  