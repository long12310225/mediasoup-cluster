const { NacosNamingClient } = require('nacos');
import axios from 'axios';
import Logger from '@/common/utils/Logger';
import env from '@/config/env';
import * as internalIp from 'internal-ip';

export const registryNacos = async () => {
  const logger = new Logger('registry nacos')
  try {
    const data = (await axios.post(`https://${env.getEnv('N_HOSTNAME')}${env.getEnv('N_PATH')}`)).data

    if (!data?.accessToken) {
      logger.error('nacos服务异常!!!!')
      return;
    }
    logger.info('Access Token:', data.accessToken) // 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYWFzLXVuaW9uRGV2IiwiZXhwIjoxNzE2NDg3NTg0fQ.KqDYU2K9iuD_xMw4v3qw1GCh9YDGJ20ICnKafx7uCnc'

    const nacosclient = new NacosNamingClient({
      logger: logger,
      serverList: env.getEnv('N_SERVER_LIST'),
      namespace:  env.getEnv('N_NAMESPACE'),
      username:   env.getEnv('N_USRENAME'),
      password:   env.getEnv('N_PASSWORD'),
      accessKey:  data.accessToken,
    })
    nacosclient.registerInstance(
      env.getEnv('N_NACOS_CLIENT_NAME'),
      {
        ip: env.getEnv('SERVER_IP') || internalIp.v4.sync(),
        port: env.getEnv('SERVER_PORT')
      },
      env.getEnv('N_NACOS_GROUP_REGISTRY')
      )
  } catch (error) {
    logger.error(error)
  }
}
