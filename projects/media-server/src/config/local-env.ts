// https://www.npmjs.com/package/class-validator#passing-options
import { IsNotEmpty, IsNumber, Max, Min, ValidateIf } from 'class-validator';
import { Expose } from 'class-transformer';

const emptyList = [null, undefined];
export default class LocalEnv {
  /**
   * 系统服务配置
   */
  @Expose()
  @ValidateIf((o) => !emptyList.includes(o.SERVER_PORT))
  @Min(1)
  @Max(65535)
  @IsNumber()
  @IsNotEmpty()
  readonly SERVER_PORT: number;

  @Expose()
  @ValidateIf((o) => !emptyList.includes(o.PRO_DOC))
  @IsNotEmpty()
  readonly PRO_DOC: boolean;

  // @Expose()
  // @IsNotEmpty()
  // readonly WEB_OSS: boolean;

}
