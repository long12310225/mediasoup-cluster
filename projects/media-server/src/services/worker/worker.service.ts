import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { types } from 'mediasoup';
import { CONSTANTS } from '@/common/enum';

import { mediasoupWorkerManager } from '../../common/worker/worker';
import env from '@/config/env';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class WorkerService {

  constructor(
    @InjectRepository(MediaWorker)
    private readonly mediaWorkerDo: MediaWorker,
    @InjectPinoLogger(WorkerService.name)
    private readonly logger: PinoLogger,
  ) {}

  async init() {
    await mediasoupWorkerManager.init();
    await this.removeCurrentServer();
    await this.addWorkers(mediasoupWorkerManager.workers);
    this.serverListenning();
  }

  /**
   * 从 media_worker 表移除当前服务的行
   */
  removeCurrentServer() {
    return MediaWorker.createQueryBuilder()
      .delete()
      .where('api_host = :apiHost', {
        apiHost: env.getEnv('LISTEN_HOST') || '127.0.0.1',
      })
      .andWhere('api_port = :apiPort', {
        apiPort: Number(process.env.PORT || env.getEnv('SERVER_PORT')),
      })
      .execute();
  }

  async addWorkers(workers: Array<types.Worker>) {
    const models = workers.map((worker) => {
      const dbWorker = new MediaWorker();
      dbWorker.apiHost = env.getEnv('LISTEN_HOST') || '127.0.0.1';
      dbWorker.apiPort = Number(process.env.PORT || env.getEnv('SERVER_PORT'));
      dbWorker.maxTransport =
        Number(env.getEnv('SLAVE_MAX_TRANSPORT_PER_WORKER')) || 100;
      dbWorker.type = process.env.SLAVE_FOR || CONSTANTS.CONSUMER;
      dbWorker.pid = worker.pid;
      dbWorker.isAliveServe = 1;
      return dbWorker;
    });

    await MediaWorker.getRepository().save(models);
  }

  /**
   * 根据类型查询 producer / consumer 的 worker
   * @param type
   * @returns
   */
  async getWorker(type: string) {
    /**
     * 添加验证服务是否存在，没有则取下一条【获取服务信息时，要返回该服务的类型】
     * 缺点：
     * 额外网络请求（耗时）
     */
    const worker = await MediaWorker.createQueryBuilder()
      .select('worker')
      .from(MediaWorker, 'worker')
      .where('worker.type = :type', { type: type })
      .andWhere('worker.transportCount < worker.maxTransport')
      .andWhere('worker.is_alive_serve = :isAliveServe', { isAliveServe: 1 })
      .getOne();
    // 如果存在则返回，没有则抛404
    if (!worker) {
      this.logger.error('worker not found')
      return;
    }
    return worker;
  }

  async get(data: { workerId: string }) {
    const worker = await MediaWorker.getRepository().findOne({
      where: { id: data.workerId },
    });
    if (!worker) {
      this.logger.error('worker表没有这条数据');
      return;
    }
    return worker;
  }

  /**
   * 监听服务状态
   */
  serverListenning() {
    // 关闭服务时触发事件
    process.on('SIGINT', async () => {
      this.logger.info('SIGINT event: removeCurrentServer of mediaworker')
      await this.removeCurrentServer();
      process.exit(0);
    });
    // process.on('SIGTERM', function() {
    //   console.log('SIGTERM Shutting down server...');
    // });
    // process.on('beforeExit', function() {
    //   console.log('beforeExit Shutting down server...');
    // });
    // process.on('exit', function() {
    //   console.log('exit Shutting down server...');
    // });
  }

  /**
   * 获取 worker 列表
   */
  public async getList(data: {
    serverType: string
  }) {
    const workers = await MediaWorker.getRepository().find();
    if (!workers) {
      this.logger.error('workers not found')
      return;
    }
    return workers;
  }

  /**
   * 删除表中某条数据
   */
  public async deleteWorker(data: { workerId: string }) {
    try {
      const worker = await this.get(data);
      if (!worker) {
        return {
          msg: '没有该条数据'
        }
      } 
      const res = await MediaWorker.getRepository().delete({
        id: data.workerId
      });
      if (res?.affected) {
        return {
          msg: '删除成功'
        }
      } else {
        return {
          msg: '删除失败'
        }
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
