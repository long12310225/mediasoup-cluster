const { NacosNamingClient } = require('nacos');
const https = require('https');
import Logger from '@/shared/utils/Logger';
import env from '@/config/env';
import * as internalIp from 'internal-ip';

export const loginnacos = async function () {
  // 发起POST请求
  const req = https.request({
    hostname: env.getEnv('N_HOSTNAME'),
    path: env.getEnv('N_PATH'),
    method: 'POST',
  }, (res) => {
    let data = ''

    // 数据接收事件处理器
    res.on('data', (chunk) => {
      data += chunk
    })

    // 数据接收完毕事件处理器
    res.on('end', () => {
      // 这里处理完整的响应体数据
      // console.log('Response Body:', data)
      // 解析响应体为JSON对象
      const responseJson = JSON.parse(data)

      // 访问并打印accessToken
      const accessToken = responseJson.accessToken
      console.log('Access Token:', accessToken) // 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYWFzLXVuaW9uRGV2IiwiZXhwIjoxNzE2NDg3NTg0fQ.KqDYU2K9iuD_xMw4v3qw1GCh9YDGJ20ICnKafx7uCnc'

      const nacosclient = new NacosNamingClient({
        logger: new Logger(),
        serverList: env.getEnv('N_SERVER_LIST'),
        namespace:  env.getEnv('N_NAMESPACE'),
        username:   env.getEnv('N_USRENAME'),
        password:   env.getEnv('N_PASSWORD'),
        accessKey:  accessToken,
      })
      nacosclient.registerInstance(
        env.getEnv('N_NACOS_CLIENT_NAME'),
        {
          ip: env.getEnv('SERVER_IP') || internalIp.v4.sync(),
          port: env.getEnv('SERVER_PORT')
        },
        'DEFAULT_GROUP'
      )
    })
  })

  // 错误处理
  req.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('Error:', err.message)
  })

  // 结束请求
  req.end()
}
