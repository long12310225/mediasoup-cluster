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
import { ServeService } from '@/services/serve/serve.service';

@Controller()
export class ServeController {
  constructor(
    private readonly serveService: ServeService
  ) { }

  @Get('/serve/getStaff')
  getServerStaff(@Params() data) {
    return this.serveService.getServeStaff(data);
  }
  
}
