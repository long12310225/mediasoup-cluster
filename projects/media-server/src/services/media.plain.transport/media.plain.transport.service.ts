import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { MediaRouterService } from '../media.router/media.router.service';
import env from '@/config/env';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class MediaPlainTransportService {
  // 缓存 transport
  static transports = new Map<string, types.PlainTransport>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly mediaRouterService: MediaRouterService
  ) { 
    this.logger.setContext(MediaPlainTransportService.name)
  }

  /**
   * 创建 plainTransport
   * @param {{ routerId: string, plainTransportOption: Object } } data
   * @returns 
   */
  async create(data: {
    routerId: string,
    plainTransportOptions: Object,
  }): Promise<types.PlainTransport> {
    try {
      // 根据 routerId 从 mediasoupRouterManager 中获取出相关 router
      const router = this.mediaRouterService.get(data.routerId);
      if (!router) return
  
      // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createPlainTransport
      // 创建一个 plainTransport 传输对象
      const params = {
        ...JSON.parse(env.getEnv('MEDIASOUP_PLAIN_TRANSPORT_OPTIONS')),
        // rtcpMux: false,
        // comedia: true,
        ...data.plainTransportOptions
      }
      const transport = await router.createPlainTransport(params);
  
      return transport;
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 创建 mediasoup producer plainTransport
   * @param { { routerId: string, plainTransportOptions: Object } } data
   * @returns 
   */
  async createMediasoupPlainTransport(data: {
    routerId: string,
    plainTransportOptions: Object,
  }) {
    try {
      const transport = await this.create(data);
  
      // 缓存到 transports 中
      // const constructor = this.constructor as typeof MediaPlainTransportService;
      MediaPlainTransportService.transports.set(transport.id, transport);
      // console.log("%c Line:198 🍤 3 创建transport -- MediaPlainTransportService.transports", "color:#2eafb0", MediaPlainTransportService.transports);
  
      // 返回 transport 部分属性
      const transportData = {
        id: transport.id,
        ip: transport.tuple.localIp,
        port: transport.tuple.localPort,
        rtcpPort: transport.rtcpTuple ? transport.rtcpTuple.localPort : undefined,
      }
  
      return transportData;
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 从缓存 transports 中取出 transport
   * @param transportId 
   * @returns 
   */
  get(transportId: string) {
    // const transport = (this.constructor as typeof MediaPlainTransportService).transports.get(transportId);
    const transport = MediaPlainTransportService.transports.get(transportId);
    if (!transport) {
      this.logger.error(`this ${transportId} plainTransport was not found`);
      return;
    }
    return transport;
  }

  /**
   * 根据 transportId 连接 transport
   * @param data 
   * @returns 
   */
  async connect(data: {
    transportId: string;
    ip: string;
    port: number;
    rtcpPort: number;
  }) {
    // console.log("%c Line:198 🍪 4 连接 transport -- connect data: ", "color:#2eafb0", data);
    
    // 从缓存中取出 transport
    const transport: types.PlainTransport = this.get(data.transportId);
    // console.log("%c Line:198 🍪 4 连接 transport -- transport: ", "color:#2eafb0", transport);
    
    if (!transport) return;

    try {
      // 连接 transport
      await transport.connect({
        ip: data.ip,
        port: data.port,
        rtcpPort: data.rtcpPort
      });
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 关闭 transport
   * @param data transportId
   */
  async close(data: { transportId: string }) {
    try {
      // 从缓存 transports 中取出 transport
      const transport = this.get(data.transportId);
      if (!transport) return;
      // 关闭
      transport.close();
      // 从缓存 transports 中删除该 transport
      (this.constructor as typeof MediaPlainTransportService).transports.delete(data.transportId);
    } catch (e) {
      this.logger.error(e)
    }
  }
}
