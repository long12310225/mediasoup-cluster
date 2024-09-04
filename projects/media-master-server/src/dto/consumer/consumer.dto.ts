/**
 * https://www.npmjs.com/package/class-validator
 */
import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { types } from 'mediasoup';

export class CreateConsumerDo {
  @IsString()
  routerId?: string;

  @IsNotEmpty()
  @IsString()
  transportId: string;

  @IsNotEmpty()
  @IsString()
  producerId: string;

  @IsNotEmpty()
  rtpCapabilities: types.RtpCapabilities;

  @IsString()
  peerId?: string;

  @IsString()
  broadcasterId?: string;
}

export class ConsumerDo {
  @IsNotEmpty()
  @IsString()
  consumerId: string;

  /**
   * 消费优先级
   */
  priority?: any;

  spatialLayer?: any;
  temporalLayer?: any;
}
