import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { MediasoupProducerWebRTCTransport } from '../media.webrtc.transport/mediasoup.producer.webrtc.transport.service';

@Injectable()
export class MediaDataProducerService {
  static dataProducers = new Map<string, types.DataProducer>();

  constructor(
    private readonly mediasoupProducerWebRTCTransport: MediasoupProducerWebRTCTransport,
  ) {}

  /**
   * 创建 dataProducer
   * @param data
   */
  async createProduceData(data: {
    transportId: string;
    label: string;
    protocol: string;
    sctpStreamParameters: any;
    appData: any;
  }) {
    const transport = this.mediasoupProducerWebRTCTransport.get(
      data.transportId,
    );

    if (!transport) {
      console.warn('createProduceData() | Transport for consuming not found');
      return;
    }

    // https://mediasoup.org/documentation/v3/mediasoup/api/#DataProducer
    const dataProducer = await transport.produceData({
      label: data.label,
      protocol: data.protocol,
      sctpStreamParameters: data.sctpStreamParameters,
      appData: data.appData,
    });

    // 缓存 producer
    MediaDataProducerService.dataProducers.set(dataProducer.id, dataProducer);

    // 返回 dataProducer 信息
    return {
      id: dataProducer.id,
      closed: dataProducer.closed,
      type: dataProducer.type,
      sctpStreamParameters: dataProducer.sctpStreamParameters,
      label: dataProducer.label,
      protocol: dataProducer.protocol,
      appData: dataProducer.appData,
    };
  }

  /**
   * 根据 dataProducerId 获取 dataProducer
   */
  get(data: { dataProducerId: string }) {
    // 从缓存中取出 dataProducer
    const dataProducer = MediaDataProducerService.dataProducers.get(
      data.dataProducerId,
    );
    if (dataProducer) {
      return dataProducer;
    }
    console.error('dataProducer not found');
    return;
  }

  /**
   * 根据 dataProducerId 获取 dataProducer 状态
   * @param data
   * @returns
   */
  async getStats(data: { dataProducerId: string }) {
    // 获取 dataProducer
    const dataProducer = this.get(data);
    const stats = await dataProducer.getStats();
    return stats;
  }

  getDataProducers(data) {
    const mediaDataProducers = MediaDataProducerService.dataProducers.keys()
    return mediaDataProducers;
  }
}
