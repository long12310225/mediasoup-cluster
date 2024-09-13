/**
 * https://www.npmjs.com/package/class-validator
 */
import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTransportDo {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  webRtcTransportOptions: any;

  @IsString()
  peerId?: string;
}

export class TransportDo {
  @IsNotEmpty()
  @IsString()
  transportId: string;
}

export class PlainTransportDo {
  @IsNotEmpty()
  @IsString()
  transportId: string;
  
  @IsString()
  ip: string;
  
  port: number;
  
  rtcpport: number;
}
