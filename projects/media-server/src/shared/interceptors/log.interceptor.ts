import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor that logs input/output requests
 */
@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly ctxPrefix: string = LogInterceptor.name;

  /**
   * Intercept method, logs before and after the request being processed
   * @param context details about the current request
   * @param call$ implements the handle method that returns an Observable
   */
  public intercept(
    context: ExecutionContext,
    call$: CallHandler,
  ): Observable<any> {
    return call$.handle().pipe(
      tap({
        next: (val: any): void => {
          this.logNext(val, context);
        },
        error: (err: Error): void => {
          this.logError(err, context);
        },
      }),
    );
  }

  /**
   * Logs the request response in success cases
   * @param body body returned
   * @param context details about the current request
   */
  private logNext(body: any, context: ExecutionContext): void {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    Logger.log(
      `Status code: ${statusCode} | Method: ${method} | Path: ${originalUrl} | IP: ${ip}`,
    );
  }

  /**
   * Logs the request response in success cases
   * @param error Error object
   * @param context details about the current request
   */
  private logError(error: Error, context: ExecutionContext): void {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, originalUrl, ip } = req;

    if (error instanceof HttpException) {
      const statusCode: number = error.getStatus();

      if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        Logger.error(
          `Status code: ${statusCode} | Method: ${method} | Path: ${originalUrl} | IP: ${ip}`,
        );
      } else {
        Logger.warn(
          `Status code: ${statusCode} | Method: ${method} | Path: ${originalUrl} | IP: ${ip}`,
        );
      }
    } else {
      Logger.error(
        `Status code: ${error.message} | Method: ${method} | Path: ${originalUrl} | IP: ${ip}`,
      );
    }
  }
}
