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
import { Params } from '@/shared/decorators';
import { MediaPipeTransportService } from '@/services/media.pipe.transport/media.pipe.transport.service';

@Controller()
export class MediaPipeTransportController {
  constructor(
    private readonly mediaPipeTransportService: MediaPipeTransportService
  ) { }
  
  @Post('/routers/:routerId/destination_pipe_transports')
  createDestination(@Params() data) {
    return this.mediaPipeTransportService.createDestination(data);
  }
  
  @Post('/routers/:routerId/source_pipe_transports')
  createSource(@Params() data) {
    return this.mediaPipeTransportService.createSource(data);
  }
  
  @Post('/pipe_transports/:transportId/consume')
  consume(@Params() data) {
    return this.mediaPipeTransportService.consume(data);
  }
}
