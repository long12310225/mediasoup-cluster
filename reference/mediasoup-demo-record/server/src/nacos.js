const { NacosNamingClient } = require('nacos')
const https = require('https');
const Logger = require('../lib/Logger')
const logger = new Logger()
const config = require('../config');
module.exports = {
  loginnacos: async function () {
    const options = {
      hostname : config.nacos.tokenServer.hostname,
		  path : config.nacos.tokenServer.path,
		  method : config.nacos.tokenServer.method,
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
          serverList : config.nacos.client.serverList,
          namespace : config.nacos.client.namespace,
				  username : config.nacos.client.username,
				  password : config.nacos.client.password,
          accessKey: accessToken,
        })
        nacosclient.registerInstance(config.nacos.register.serverName, { ip: config.nacos.register.ip, port: config.nacos.register.port }, config.nacos.register.group);
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
