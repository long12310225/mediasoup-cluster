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
import { MediaPlainTransportService } from '@/services/media.plain.transport/media.plain.transport.service';
import { Params } from '@/shared/decorators';

@Controller()
export class MediaPlainTransportController {
  constructor(
    private readonly mediaPlainTransportService: MediaPlainTransportService,
  ) {}

  /**
   * 创建 plain transport
   */
  @Post('/routers/:routerId/create_plain_transports')
  createMediasoupPlainTransport(@Params() data) {
    return this.mediaPlainTransportService.createMediasoupPlainTransport(data);
  }

  /**
   * 根据 transportId 连接 transport
   */
  @Post('/plain_transports/:transportId/connect')
  connect(@Params() data) {
    return this.mediaPlainTransportService.connect(data);
  }

  /**
   * 关闭 consumer
   */
  @Delete('/plain_transports/:transportId')
  close(@Params() data) {
    return this.mediaPlainTransportService.close(data);
  }
}
