import {
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeSDK } from '@opentelemetry/sdk-node';
import * as process from 'process';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import env from '@/config/env';

const serverName = env.getEnv('TRACING_JAEGER_SERVER_NAME')

export const otelSDK = new NodeSDK({
  // name
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serverName
  }),
  // tracing
  spanProcessor: new SimpleSpanProcessor(new JaegerExporter({
    endpoint: `http://${env.getEnv('TRACING_JAEGER_IP')}:14268/api/traces`,
  })),
  instrumentations: [
    new HttpInstrumentation(),
    new FastifyInstrumentation(),
    new NestInstrumentation(),
  ],
});

process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('Error shutting down SDK', err),
    )
    .finally(() => process.exit(0));
});
