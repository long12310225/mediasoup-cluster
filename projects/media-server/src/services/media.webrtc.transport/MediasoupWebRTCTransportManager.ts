import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { MediaRouterService } from '../media.router/media.router.service';
import env from '@/config/env';
import * as chalk from 'chalk';
import { PinoLogger } from 'nestjs-pino';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class MediasoupWebRTCTransportManager {
  static transports = new Map<string, types.WebRtcTransport>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly axiosService: AxiosService,
    private readonly mediaRouterService: MediaRouterService
  ) {
    this.logger.setContext(MediasoupWebRTCTransportManager.name)
  }

  /**
   * 创建 transport
   * @param {{ routerId: string, webRtcTransportOption: Object } } data
   * @returns 
   */
  async create(data: {
    routerId: string,
    webRtcTransportOptions: Object,
    peerId?: string
  }): Promise<types.WebRtcTransport> {
    try {
      const timestrap = new Date().getTime()
      // 根据 routerId 从 mediasoupRouterManager 中获取出相关 router
      console.time(chalk.greenBright(`${timestrap} MediasoupWebRTCTransportManager this.mediaRouterService.get 耗时`))
      const router = this.mediaRouterService.get(data.routerId);
      console.timeEnd(chalk.greenBright(`${timestrap} MediasoupWebRTCTransportManager this.mediaRouterService.get 耗时`))
  
      if (!router) return
      
      /* 准备数据 */
      // 最大 incoming 位数
      const maxIncomingBitrate =
        Number(env.getEnv('MEDIASOUP_WEBRTC_TRANSPORT_MAX_INCOMING_BITRATE')) ||
        1500000;
      // outgoint 位数
      const initialAvailableOutgoingBitrate =
        Number(
          env.getEnv('MEDIASOUP_WEBRTC_TRANSPORT_INITIAL_AVAILABLE_OUTGOING_BITRATE')
        ) || 1000000;
      // v3.14.8 去掉了这个参数
      const minimumAvailableOutgoingBitrate =
        Number(
          env.getEnv('MEDIASOUP_WEBRTC_TRANSPORT_MINIMUM_AVAILABLE_OUTGOING_BITRATE')
        ) || 600000;
      const maxSctpMessageSize =
        Number(
          env.getEnv('MEDIASOUP_WEBRTC_TRANSPORT_MAX_SCTP_MESSAGE_SIZE')
        ) || 262144;
      // listenIps
      const listenIps = JSON.parse(
        env.getEnv('MEDIASOUP_WEBRTC_TRANSPORT_LISTEN_IPS') || '[]'
      );
  
      // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
      // 创建一个 webRtc 传输对象
      const params = {
        listenIps: listenIps,
        initialAvailableOutgoingBitrate,
        maxSctpMessageSize,
        maxIncomingBitrate,
        // enableUdp: true,
        // enableTcp: true,
        // preferUdp: true,
        ...data.webRtcTransportOptions
      }
      // console.log("%c Line:69 🍡 router.createWebRtcTransport params", "color:#7f2b82", params);
      console.time(chalk.greenBright(`${timestrap} MediasoupWebRTCTransportManager router.createWebRtcTransport 耗时`))
      const transport = await router.createWebRtcTransport(params);
      console.timeEnd(chalk.greenBright(`${timestrap} MediasoupWebRTCTransportManager router.createWebRtcTransport 耗时`))
      
      console.time(chalk.greenBright(`${timestrap} MediasoupWebRTCTransportManager this.transportHanlder 耗时`))
      if(data.peerId) await this.transportHanlder(transport, data.peerId)
      console.timeEnd(chalk.greenBright(`${timestrap} MediasoupWebRTCTransportManager this.transportHanlder 耗时`))
  
      // 给传输对象设置最大位数
      // if (maxIncomingBitrate) {
      //   try {
      //     await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      //   } catch (error) {
      //     console.warn('WebRtcTransport "maxIncomingBitrate" event [error:%s]', error)
      //   }
      // }
  
      return transport;
    } catch (e) {
      this.logger.error(e)
    }
  }

  async transportHanlder(transport, peerId) {
    // 注册sctp状态改变事件
    transport.on('sctpstatechange', (sctpState) => {
      console.debug('WebRtcTransport "sctpstatechange" event [sctpState:%s]', sctpState)
    })

    // 注册dtls状态改变事件
    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'failed' || dtlsState === 'closed')
        console.warn('WebRtcTransport "dtlsstatechange" event [dtlsState:%s]', dtlsState)
    })
    
    // NOTE: For testing.
    // await transport.enableTraceEvent([ 'probation', 'bwe' ]);
    await transport.enableTraceEvent(['bwe']) // 启用跟踪功能
    
    transport.on('trace', async (trace) => {
      // console.debug(
      //   'transport "trace" event [transportId:%s, trace.type:%s, trace:%o]',
      //   transport.id,
      //   trace.type,
      //   trace
      // )

      if (trace.type === 'bwe' && trace.direction === 'out') {
        // 发起 http 请求，像主应用传递事件
        // this.axiosService.fetchApiMaster({
        //   path: '/message/notify',
        //   method: 'POST',
        //   data: {
        //     method: 'downlinkBwe',
        //     params: {
        //       desiredBitrate: trace.info.desiredBitrate,
        //       effectiveDesiredBitrate: trace.info.effectiveDesiredBitrate,
        //       availableBitrate: trace.info.availableBitrate,
        //     },
        //     peerId
        //   },
        // });
      }
    })
  }

  /**
   * 从缓存 transports 中取出 transport
   * @param transportId 
   * @returns 
   */
  get(transportId: string) {
    const transport = (this.constructor as typeof MediasoupWebRTCTransportManager).transports.get(transportId);
    if (!transport) {
      this.logger.warn(`缓存中没有找到 ${transportId} 此 webrtcTransport`);
      return
    }
    return transport;
  }

  /**
   * 根据 transportId 连接 transport
   * @param data 
   * @returns 
   */
  async connect(data: { transportId: string; dtlsParameters: any }) {
    try {
      // 从缓存中取出 transport
      const transport = this.get(data.transportId);
      if (!transport) return
      
      // 连接 transport
      await transport.connect({ dtlsParameters: data.dtlsParameters });
  
      // 连接后返回一个空对象
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
      (this.constructor as typeof MediasoupWebRTCTransportManager).transports.delete(data.transportId);
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 获取 transport 状态
   * @param data transportId
   */
  async getStats(data: { transportId: string }) {
    try {
      // 从缓存 transports 中取出 transport
      const transport = this.get(data.transportId);
      // console.log("%c Line:202 🍏 getStats 缓存中取出 transport", "color:#93c0a4", transport);
      if (!transport) return;
      
      const res = await transport.getStats();
      // console.log("%c Line:206 🍧 getStats transport stats res", "color:#b03734", res);
      return res
    } catch (e) {
      this.logger.error(e)
    }
  }
}