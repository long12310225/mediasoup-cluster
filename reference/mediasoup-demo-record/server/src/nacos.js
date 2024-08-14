const { NacosNamingClient } = require('nacos')
const https = require('https');
const Logger = require('../lib/Logger')
const logger = new Logger()

module.exports = {
  loginnacos: async function () {
    const options = {
      hostname: 'dev2saasnacosconsole.bndxqc.com',
      path: '/nacos/v1/auth/users/login?username=saas-unionDev&password=saas-unionDev',
      method: 'POST',
    }

    // 发起POST请求
    const req = https.request(options, (res) => {
      let data = ''

      // 数据接收事件处理器
      res.on('data', (chunk) => {
        data += chunk
      })

      // 数据接收完毕事件处理器
      res.on('end', () => {
        // 这里处理完整的响应体数据
        console.log('Response Body:', data)
        // 解析响应体为JSON对象
        const responseJson = JSON.parse(data)

        // 访问并打印accessToken
        const accessToken = responseJson.accessToken
        console.log('Access Token:', accessToken) // 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYWFzLXVuaW9uRGV2IiwiZXhwIjoxNzE2NDg3NTg0fQ.KqDYU2K9iuD_xMw4v3qw1GCh9YDGJ20ICnKafx7uCnc'

        const nacosclient = new NacosNamingClient({
          logger,
          serverList: 'dev2saasnacos.bndxqc.com:8848',
          namespace: 'saas-unionDev',
          username: 'saas-unionDev',
          password: 'saas-unionDev',
          accessKey: accessToken,
        })
        nacosclient.registerInstance(
          'bonade-saas-mediasoup',
          {
            ip: '10.2.110.156',
            port: 4443,
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
  },
}
