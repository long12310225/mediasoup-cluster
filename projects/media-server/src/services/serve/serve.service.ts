import { Injectable } from '@nestjs/common';
import { Serve } from '../../dao/serve/serve.do';
import env from '../../config/env';

@Injectable()
export class ServeService {

  public async addServe() {
    const serve = new Serve();
    serve.host = env.getEnv('LISTEN_HOST') || '127.0.0.1';
    serve.port = Number(process.env.PORT || env.getEnv('SERVER_PORT'));
    serve.isAliveServe = 1;
    await Serve.getRepository().save(serve);
  }

  public async getServeStaff(data) {
    if(data.flag) return env.localEnvConfig;
  }
}
