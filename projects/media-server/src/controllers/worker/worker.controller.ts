import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Params } from '@/common/decorators';
import { WorkerService } from '@/services/worker/worker.service';

@Controller()
export class WorkerController {
  constructor(
    private readonly workerService: WorkerService
  ) { }

  /**
   * 查询worker列表
   */
  @Get('/workers/getList')
  getList(@Params() data) {
    return this.workerService.getList(data);
  }

  /**
   * 移除某条worker的数据
   */
  @Delete('/workers/removeOne')
  deleteWorker(@Params() data) {
    return this.workerService.deleteWorker(data)
  }
}
