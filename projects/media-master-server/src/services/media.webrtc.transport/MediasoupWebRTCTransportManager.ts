import { types } from 'mediasoup';

export class MediasoupWebRTCTransportManager {
  static transports = new Map<string, types.Transport>();

  /**
   * 从缓存 transports 中取出 transport
   * @param transportId 
   * @returns 
   */
  get(transportId: string) {
    const transport = (
      this.constructor as typeof MediasoupWebRTCTransportManager
    ).transports.get(transportId);
    if (transport) {
      return transport;
    }
    throw new Error('Transport not found');
  }

  /**
   * 根据 transportId 连接 transport
   * @param data 
   * @returns 
   */
  async connect(data: { transportId: string; dtlsParameters: any }) {
    // 从缓存中取出 transport
    const transport = this.get(data.transportId);
    // 连接 transport
    await transport.connect({ dtlsParameters: data.dtlsParameters });

    // 返回一个空对象【FIX】
    return {};
  }

  /**
   * 关闭 transport
   * @param data transportId
   */
  async close(data: { transportId: string }) {
    // 从缓存 transports 中取出 transport
    const transport = this.get(data.transportId);
    // 关闭
    transport.close();
    // 从缓存 transports 中删除该 transport
    (
      this.constructor as typeof MediasoupWebRTCTransportManager
    ).transports.delete(data.transportId);
  }
}