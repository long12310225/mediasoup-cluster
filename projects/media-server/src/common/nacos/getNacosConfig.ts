const { NacosConfigClient } = require('nacos');
import axios from 'axios';
import env from '@/config/env';
import { load as yamlLoad } from 'js-yaml';

export const getNacosConfig = async () => {
  try {
    const data = await (await axios.post(`https://${env.getEnv('N_HOSTNAME')}${env.getEnv('N_PATH')}`)).data

    if (!data?.accessToken) {
      return {}
    }

    // console.log("%c Line:9 🍆 res", "color:#e41a6a", data.accessToken);

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
      console.log('nacos配置有误!!!!!!')
    }
    const nacosConfigJson = yamlLoad(nacosConfig, 'utf8');
    return nacosConfigJson
  } catch (error) {
    console.log(error)
  }
};
