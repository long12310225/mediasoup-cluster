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
import { UserService } from '@/services/user/user.service';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService
  ) { }

  /**
   * 退出房间
   */
  @Post('/user/:userId/logout')
  logout(@Params() data) {
    return this.userService.logout(data)
  }
}
