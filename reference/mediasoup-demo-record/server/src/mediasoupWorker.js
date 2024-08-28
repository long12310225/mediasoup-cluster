const mediasoup = require('mediasoup');
const config = require('../config');
const Logger = require('../lib/Logger');
const logger = new Logger();

module.exports = {
  /**
   * Launch as many mediasoup Workers as given in the configuration file.
   * 初始化worker实例（实例数量与CPU核心数相同）
   * 将worker实例缓存中全局，用数组收集起来备用
   */
  runMediasoupWorkers: async function () {
    // mediasoup Workers.
    // @type {Array<mediasoup.Worker>}
    const mediasoupWorkers = []

    const { numWorkers } = config.mediasoup
    logger.info('running %d mediasoup Workers...', numWorkers)

    // 有多少核心就创建多少工作进程
    for (let i = 0; i < numWorkers; ++i) {
      // 将 worker 实例添加到数组中
      const worker = await mediasoup.createWorker({
        logLevel: config.mediasoup.workerSettings.logLevel,
        logTags: config.mediasoup.workerSettings.logTags,
        rtcMinPort: Number(config.mediasoup.workerSettings.rtcMinPort),
        rtcMaxPort: Number(config.mediasoup.workerSettings.rtcMaxPort),
      })

      // 监听 worker 的 died 事件，在回调中结束进程
      worker.on('died', () => {
        logger.error('mediasoup Worker died, exiting  in  seconds... [pid:%d]', worker.pid)

        setTimeout(() => process.exit(1), 2000)
      })

      // 将 worker 实例添加到全局数组中，缓存起来
      mediasoupWorkers.push(worker)

      // Log worker resource usage every X seconds.
      // 每120秒打印一次 worker 的资源使用情况
      setInterval(async () => {
        const usage = await worker.getResourceUsage()
        logger.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage)
      }, 120000)

    }
    return mediasoupWorkers
  },
}
