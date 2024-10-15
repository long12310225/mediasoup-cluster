/**
 * https://www.npmjs.com/package/class-validator
 */
import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { types } from 'mediasoup';

export class CreateProducerDo {
  @IsNotEmpty()
  transportId: string;

  @IsNotEmpty()
  kind: types.MediaKind;

  @IsNotEmpty()
  rtpParameters: types.RtpParameters;

  appData?: any;

  @IsString()
  peerId?: string = ''
}

export class ProducerDo {
  @IsNotEmpty()
  @IsString()
  producerId: string;
}


