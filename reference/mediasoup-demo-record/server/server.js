#!/usr/bin/env node

// process.title = 'mediasoup-demo-server'
// process.env.DEBUG = process.env.DEBUG || '*INFO* *WARN* *ERROR*'

const https = require('https')
const url = require('url')

const interactiveServer = require('./lib/interactiveServer')
const interactiveClient = require('./lib/interactiveClient')
const { createExpressApp, runHttpsServer } = require('./src/express')
const { runProtooWebSocketServer } = require('./src/websocket')
const { runMediasoupWorkers } = require('./src/mediasoupWorker')
const { loginnacos } = require('./src/nacos')

// Map of Room instances indexed by roomId.
// @type {Map<Number, Room>}
const rooms = new Map()

;(async function () {
  // 服务发现
  loginnacos()

  /***************************************************
   ****************** mediasoup 相关 ******************
   ***************************************************/

  // // Open the interactive server.
  // await interactiveServer()

  // // Open the interactive client.
  // if (process.env.INTERACTIVE === 'true' || process.env.INTERACTIVE === '1') {
  //   await interactiveClient()
  // }

  // Run a mediasoup Worker.
  // 初始化worker实例（实例数量与CPU核心数相同）
  const mediasoupWorkers = await runMediasoupWorkers()

  /***************************************************
   ******************* express 相关 *******************
   ***************************************************/

  // Create Express app.
  // 创建express实例，用于处理广播拉流推流的接口
  const httpsServer = await createExpressApp(rooms)

  // Run a protoo WebSocketServer.
  // 将http服务升级为websocket服务
  await runProtooWebSocketServer({ httpsServer, rooms, mediasoupWorkers })

  // Log rooms status every X seconds.
  setInterval(() => {
    for (const room of rooms.values()) {
      room.logStatus()
    }
  }, 120000)
})()
