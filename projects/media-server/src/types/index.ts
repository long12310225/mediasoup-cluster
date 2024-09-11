import { types } from 'mediasoup';
import { type } from 'os';

export type WebRtcTransportData = {
  readonly id: string;
  readonly iceParameters: types.IceParameters;
  readonly iceCandidates: types.IceCandidate[];
  readonly dtlsParameters: types.DtlsParameters;
  readonly sctpParameters: types.SctpParameters;
}
