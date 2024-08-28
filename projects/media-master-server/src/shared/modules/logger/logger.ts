import Pino, { Logger, LoggerOptions } from 'pino';
import { trace, context } from '@opentelemetry/api';
import { getCurrentDateTime } from '@/common/utils'

const loggerOptions: LoggerOptions = {
  level: 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
    // Workaround for PinoInstrumentation (does not support latest version yet)
    log(object) {
      // 获取span
      const span = trace.getSpan(context.active());
      if (!span) return { ...object };
      const { spanId, traceId } = trace
        .getSpan(context.active())
        ?.spanContext();
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

export const logger: Logger = Pino(loggerOptions)
  // .child({
  //   file: {
  //     line: new Error().stack.split('\n')[2].trim().split(' ')[1], // 获取当前行数
  //   },
  // });