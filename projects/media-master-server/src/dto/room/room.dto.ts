/**
 * https://www.npmjs.com/package/class-validator
 */
import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RoomDto {
  @IsNotEmpty()
  readonly roomId: string;
}
