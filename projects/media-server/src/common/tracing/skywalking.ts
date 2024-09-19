import agent from 'skywalking-backend-js';
import env from '@/config/env';

export const startSky = () => {
  const tracingServerName = env.getEnv('TRACING_SERVER_NAME');
  const tracingHost = env.getEnv('TRACING_HOST');
  const tracingPost = env.getEnv('TRACING_PORT');

  agent.start({
    serviceName: tracingServerName,
    collectorAddress: `${tracingHost}:${tracingPost}`,
  });
};
