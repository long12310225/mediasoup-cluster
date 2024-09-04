/**
 * https://www.npmjs.com/package/class-validator
 */
import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RouterDo {
  @IsNotEmpty()
  @IsString()
  routerId: string;
}