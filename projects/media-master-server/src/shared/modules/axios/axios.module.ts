import { Module, Global, DynamicModule } from '@nestjs/common';
import {
  HttpModule,
  HttpModuleOptions,
  HttpModuleAsyncOptions,
} from 'nestjs-axios';
import { AxiosService } from './axios.service';

@Global()
@Module({
  providers: [AxiosService],
  exports: [AxiosService],
})
export class AxiosModule {
  static forRoot(config: HttpModuleOptions): DynamicModule {
    return {
      module: AxiosModule,
      imports: [HttpModule.forRoot(config)],
      exports: [AxiosService],
    };
  }

  static forRootAsync(config: HttpModuleAsyncOptions): DynamicModule {
    return {
      module: AxiosModule,
      imports: [HttpModule.forRootAsync(config)],
      exports: [AxiosService],
    };
  }
}
