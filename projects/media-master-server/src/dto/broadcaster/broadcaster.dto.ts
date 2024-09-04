/**
 * https://www.npmjs.com/package/class-validator
 */
import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BroadcasterDto {
  /**
   * Broadcaster id
   */
  @IsNotEmpty()
  readonly id: string;

  /**
   * Descriptive name
   */
  @IsNotEmpty()
  readonly displayName: string;

  /**
   * Additional info with name, version and flags fields.
   */
  @IsNotEmpty()
  readonly device: {
    name: string,
    version: string
  };

  /**
   * Device RTP capabilities.
   */
  @IsNotEmpty()
  readonly rtpCapabilities: any;
}

export class BroadcasterTransportDto {
  /**
   * broadcasterId
   */
  @IsNotEmpty()
  broadcasterId: string;

  /**
   * Can be 'plain' (PlainTransport) or 'webrtc' (WebRtcTransport).
   */
  @IsNotEmpty()
  readonly type: string;

  /**
   * Just for PlainTransport, use RTCP mux.
   */
  @IsNotEmpty()
  readonly rtcpMux: Boolean;

  /**
   * Just for PlainTransport, enable remote IP:port
   */
  @IsNotEmpty()
  readonly comedia: Boolean;

  /**
   * SCTP capabilities
   */
  @IsNotEmpty()
  readonly sctpCapabilities: any;
}

export class ConnectBroadcasterTransportDto {
  @IsNotEmpty()
  readonly broadcasterId: string;

  @IsNotEmpty()
  readonly transportId: string;

  @IsNotEmpty()
  readonly dtlsParameters: any;
}
