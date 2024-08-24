import { type types, createWorker } from 'mediasoup';
import env from '@/config/env';
import * as os from 'os';

class MediasoupWorkerManager {
  // 声明 workers
  public workers = new Array<types.Worker>();

  private static _instance = null;

  static getInstance() {
    if (!this._instance) {
      this._instance = new MediasoupWorkerManager()
    } 
    return this._instance
  }

  /**
   * 初始化 workers
   */
  public async init() {
    const numWorkers = Number(env.getEnv('MEDIASOUP_NUMBER_OF_WORKERS') || Object.keys(os.cpus()).length);

    for (let i = 0; i < numWorkers; ++i) {
      // mediasoup 创建 worker
      const worker = await createWorker({
        logLevel: env.getEnv('MEDIASOUP_LOG_LEVEL') as any,
        logTags: env.getEnv('MEDIASOUP_LOG_TAGS'),
        rtcMinPort: env.getEnv('MEDIASOUP_RTC_MIN_PORT') || 20000,
        rtcMaxPort: env.getEnv('MEDIASOUP_RTC_MAX_PORT') || 40000,
      });

      worker.on('died', (e) => {
        console.error('mediasoup Worker died ==> ', e);
      });

      this.workers.push(worker);
    }
  }

  /**
   * 根据 pid 获取相关 worker
   * @param { number } pid 
   * @returns worker
   */
  public get(pid: number) {
    const worker = this.workers.find((worker) => worker.pid === pid);
    if (worker) {
      return worker;
    }
    console.error('Worker not found, 请添加服务')
    return
  }
}

export const mediasoupWorkerManager = MediasoupWorkerManager.getInstance();
