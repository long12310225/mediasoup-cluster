import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
import { MediaWorker } from '@/dao/worker/media.worker.do';
import { types } from 'mediasoup';
import { constants } from '@/shared/constants';

import { mediasoupWorkerManager } from '../../shared/libs/worker';
import env from '@/config/env';

@Injectable()
export class WorkerService {
  constructor(
    @InjectRepository(MediaWorker)
    private readonly mediaWorkerDo: MediaWorker,
  ) {}

  async init() {
    await mediasoupWorkerManager.init();
    await this.removeCurrent();
    await this.addWorkers(mediasoupWorkerManager.workers);
  }

  removeCurrent() {
    return MediaWorker.createQueryBuilder()
      .delete()
      .where('apiHost = :apiHost', {
        apiHost: env.getEnv('LISTEN_HOST') || '127.0.0.1',
      })
      .andWhere('apiPort = :apiPort', {
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
      dbWorker.for = process.env.SLAVE_FOR || constants.CONSUMER;
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
  async getFor(type: string) {
    return await WorkerService.getFor(type);
  }

  static async getFor(type: string) {
    /*
     通过 this.entityManager 获取数据库管理者 manager，
     接着执行 SQL 
     */
    const worker = await MediaWorker.createQueryBuilder()
      .select('worker')
      .from(MediaWorker, 'worker')
      .where('worker.for = :for', { for: type })
      .andWhere('worker.transportCount < worker.maxTransport')
      .getOne();
    // 如果存在则返回，没有则抛404
    if (worker) {
      return worker;
    }
    throw new Error('Worker not found');
  }

  async get(data: { workerId: string }) {
    const worker = await MediaWorker.getRepository().findOne({
      where: { id: data.workerId },
    });
    if (worker) {
      return worker;
    }
    throw new Error('Worker not found');
  }
}
