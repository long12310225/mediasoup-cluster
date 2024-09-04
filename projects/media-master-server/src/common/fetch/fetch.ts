import env from '../../config/env';
import axiosPro from './AxiaoPro'
import { Method } from 'axios';
import * as https from 'https';

// 创建一个配置了TLS选项的Agent
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export function fetchApi({
  host,
  port,
  path,
  method,
  data,
}: {
  host: string;
  port?: string | number;
  path: string;
  method: Method;
  data?: Record<string, any>;
}): any {
  try {
    const parsed = axiosPro.generatePath(path, data || {});
    let body;
    if (method === 'GET') {
      parsed.path += '?' + new URLSearchParams(parsed.params);
    } else {
      body = data;
    }
    // 拼接url
    const url = 'https://' + host + (port ? ':' + port : '') + parsed.path
    
    return axiosPro({
      url,
      method,
      data: body,
      httpsAgent
    });
    
  } catch (error) {
    console.log("请求异常, 请检查: ", "color:#3f7cff", error);
    return void 0
  }
}

export function fetchApiMaster ({
  path,
  method,
  data
}) {
  return fetchApi({
    host: env.getEnv('SERVER_IP_MAIN'),
    port: env.getEnv('SERVER_PORT_MAIN'),
    path,
    method,
    data
  });
}
