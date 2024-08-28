import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { types } from 'mediasoup';
import { constants } from '@/common/constants';

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
    await this.removeCurrent();
    await this.addWorkers(mediasoupWorkerManager.workers);
  }

  removeCurrent() {
    return MediaWorker.createQueryBuilder()
      .delete()
      .where('api_host = :apiHost', {
        apiHost: env.getEnv('LISTEN_HOST') || '127.0.0.1',
      })
      .andWhere('api_port = :apiPort', {
        apiPort: Number(process.env.PORT || 3000),
      })
      .execute();
  }

  async addWorkers(workers: Array<types.Worker>) {
    const models = workers.map((worker) => {
      const dbWorker = new MediaWorker();
      dbWorker.apiHost = env.getEnv('LISTEN_HOST') || '127.0.0.1';
      dbWorker.apiPort = Number(process.env.PORT || 3000);
      dbWorker.maxTransport =
        Number(env.getEnv('SLAVE_MAX_TRANSPORT_PER_WORKER')) || 100;
      dbWorker.type = process.env.SLAVE_FOR || constants.CONSUMER;
      dbWorker.pid = worker.pid;
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
      this.logger.error('worker not found')
      return;
    }
    return worker;
  }
}
