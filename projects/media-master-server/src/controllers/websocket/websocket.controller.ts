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
import { WebSocketService } from '@/services/websocket/websocket.service';

@Controller()
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

  @Post('/message/notify')
  notify(@Body() data) {
    return this.webSocketService.notifyMain(data);
  }

  @Post('/peer/consumer/handle')
  peerConsumerHandle(@Body() data) {
    return this.webSocketService.peerConsumerHandle(data);
  }

  @Post('/peer/dataConsumer/handle')
  peerDataConsumerHandle(@Body() data) {
    return this.webSocketService.peerDataConsumerHandle(data);
  }
}
