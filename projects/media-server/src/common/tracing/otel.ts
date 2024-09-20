import * as process from 'process';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeSDK, logs } from '@opentelemetry/sdk-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { MySQLInstrumentation } from '@opentelemetry/instrumentation-mysql';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import env from '@/config/env';

const serverName = env.getEnv('TRACING_JAEGER_SERVER_NAME');

const otelSDK = new NodeSDK({
  // name
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serverName
  }),
  spanProcessors: [
    // tracing（上报到jaeger）
    new SimpleSpanProcessor(new JaegerExporter({
      endpoint: `http://${env.getEnv('TRACING_JAEGER_IP')}:${env.getEnv('TRACING_JAEGER_PORT')}/api/traces`,
    })),
  ],
  // logRecordProcessor: new logs.SimpleLogRecordProcessor(new logs.ConsoleLogRecordExporter()),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new HttpInstrumentation(),
    new FastifyInstrumentation(),
    new NestInstrumentation(),
    new MySQLInstrumentation(),
    new IORedisInstrumentation()
  ],
  // 集成 prometheus
  metricReader: new PrometheusExporter({
    port: 9464,
  })
});

process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('error shutting down SDK', err),
    )
    .finally(() => process.exit(0));
});

export const startOtel = async () => {
  try {
    await otelSDK.start();
  } catch (error) {
    console.log(error)
  }
}

