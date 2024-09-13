import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { ProducerMediaWebRTCTransport } from '../media.webrtc.transport/producer.media.webrtc.transport.service';
import { PinoLogger } from 'nestjs-pino';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class MediaDataProducerService {
  static dataProducers = new Map<string, types.DataProducer>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly axiosService: AxiosService,
    private readonly mediasoupProducerWebRTCTransport: ProducerMediaWebRTCTransport,
  ) {
    this.logger.setContext(MediaDataProducerService.name)
  }

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
    broadcasterId?: string
  }) {
    try {
      const transport = this.mediasoupProducerWebRTCTransport.get(
        data.transportId,
      );
  
      if (!transport) {
        this.logger.error('createProduceData() | Transport for consuming not found');
        return;
      }
  
      // https://mediasoup.org/documentation/v3/mediasoup/api/#DataProducer
      const dataProducer = await transport.produceData({
        label: data.label,
        protocol: data.protocol,
        sctpStreamParameters: data.sctpStreamParameters,
        appData: data.appData,
      });
      if(!dataProducer) return
  
      if (data?.broadcasterId) {
        this.handleBroadcastDataProducer(dataProducer, data?.broadcasterId)
      }
  
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
    } catch (e) {
      this.logger.error(e)
    }
  }

  handleBroadcastDataProducer(dataProducer, broadcasterId) {
    dataProducer.on('transportclose', () => {
      // Remove from its map.
      this.axiosService.fetchApiMaster({
        path: '/broadcast/dataProducer/handle',
        method: 'POST',
        data: {
          type: 'transportclose',
          params: {
            dataProducerId: dataProducer.id,
          },
          broadcasterId,
        },
      });
    });

  }

  /**
   * 根据 dataProducerId 获取 dataProducer
   */
  get(data: { dataProducerId: string }) {
    // 从缓存中取出 dataProducer
    const dataProducer = MediaDataProducerService.dataProducers.get(
      data.dataProducerId,
    );
    if (!dataProducer) {
      this.logger.error('dataProducer not found');
      return
    }
    return dataProducer;
  }

  /**
   * 根据 dataProducerId 获取 dataProducer 状态
   * @param data
   * @returns
   */
  async getStats(data: { dataProducerId: string }) {
    try {
      // 获取 dataProducer
      const dataProducer = this.get(data);
      if (!dataProducer) return 
  
      const stats = await dataProducer.getStats();
      return stats;
    } catch (e) {
      this.logger.error(e)
    }
  }

  getDataProducers(data) {
    const mediaDataProducers = MediaDataProducerService.dataProducers.keys()
    return mediaDataProducers;
  }
}
