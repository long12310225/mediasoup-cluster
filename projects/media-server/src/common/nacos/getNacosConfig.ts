const { NacosConfigClient } = require('nacos');
import axios from 'axios';
import Logger from '@/common/utils/Logger';
import env from '@/config/env';
import { load as yamlLoad } from 'js-yaml';

export const getNacosConfig = async () => {
  const logger = new Logger('get nacos config')
  try {
    const data = (await axios.post(`https://${env.getEnv('N_HOSTNAME')}${env.getEnv('N_PATH')}`)).data;

    if (!data?.accessToken) {
      logger.error('nacos服务异常!!!!')
      return {}
    }

    const client = new NacosConfigClient({
      serverAddr: env.getEnv('N_SERVER_LIST'),
      namespace: env.getEnv('N_NAMESPACE'),
      username: env.getEnv('N_USRENAME'),
      password: env.getEnv('N_PASSWORD'),
      accessKey: data.accessToken,
    });
    const nacosConfig = await client.getConfig(
      env.getEnv('N_NACOS_CONFIG_DATA_ID'),
      env.getEnv('N_NACOS_GROUP'),
    );
    if (!nacosConfig || typeof nacosConfig !== 'string') {
      logger.error('nacos配置有误!!!!!!')
    }
    const nacosConfigJson = yamlLoad(nacosConfig, 'utf8');
    return nacosConfigJson;
  } catch (error) {
    logger.error(error)
  }
};
