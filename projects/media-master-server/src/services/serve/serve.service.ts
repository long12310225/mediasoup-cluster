import { Injectable } from '@nestjs/common';
import { Serve } from '../../dao/serve/serve.do';
import env from '../../config/env';

@Injectable()
export class ServeService {
  public async init() {
    await this.addServe();
  }

  public async addServe() {
    const serve = new Serve();
    serve.host = env.getEnv('LISTEN_HOST') || '127.0.0.1';
    serve.port = Number(process.env.PORT || 3000);
    serve.isAliveServe = 1;
    console.log("%c Line:13 🍒 serve", "color:#b03734", serve);
    await Serve.getRepository().save(serve);
  }
}
