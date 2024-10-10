import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { types } from 'mediasoup';
import { mediasoupWorkerManager } from '../../common/worker/worker';
import env from '@/config/env';
import { PinoLogger } from 'nestjs-pino';
import { RouterDo } from '@/dto';

@Injectable()
export class MediaRouterService {
  // 缓存 router
  static routers = new Map<string, types.Router>();

  constructor(
    private readonly logger: PinoLogger,
  ) { 
    this.logger.setContext(MediaRouterService.name)
  }

  /**
   * 创建 mediasoup router
   * @param { { pid: number } } data
   * @returns
   */
  async create(data: { pid: number }) {
    try {
      // 获取 pid 指定 mediasoup worker
      const mediasoupWorker = mediasoupWorkerManager.get(data.pid);
      if(!mediasoupWorker) return
  
      // 从配置中获取支持的媒体编码
      // Router media codecs. 
      const mediaCodecs = JSON.parse(
        env.getEnv('MEDIASOUP_MEDIA_CODECS') || 'null',
      ) || [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
          },
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000,
          parameters: {
            'profile-id': 2,
            'x-google-start-bitrate': 1000,
          },
        },
        {
          kind: 'video',
          mimeType: 'video/h264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '4d0032',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000,
          },
        },
        {
          kind: 'video',
          mimeType: 'video/h264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000,
          },
        },
      ];
      
      // 创建 mediasoup router
      // Create a mediasoup Router.
      const mediasoupRouter = await mediasoupWorker.createRouter({ mediaCodecs }) 
  
      // 缓存 mediasoup router
      MediaRouterService.routers.set(mediasoupRouter.id, mediasoupRouter);
  
      // 返回响应体
      return {
        routerId: mediasoupRouter.id,
        rtpCapabilities: mediasoupRouter.rtpCapabilities,
      };
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 创建 mediasoup router，并缓存
   * @param { { pid: number } } data
   * @returns
   */
  async createMediasoupRouter(data: { pid: number }) {
    try {
      // 获取 pid 指定 mediasoup worker
      const mediasoupWorker = mediasoupWorkerManager.get(data.pid);
      if(!mediasoupWorker) return
  
      // 从配置中获取支持的媒体编码
      // Router media codecs. 
      const mediaCodecs = JSON.parse(
        env.getEnv('MEDIASOUP_MEDIA_CODECS') || 'null'
      ) 
      
      // 创建 mediasoup router
      // Create a mediasoup Router.
      const mediasoupRouter = await mediasoupWorker.createRouter({ mediaCodecs }) 
  
      // 缓存 mediasoup router
      MediaRouterService.routers.set(mediasoupRouter.id, mediasoupRouter);
  
      // 返回 mediasoupRouter
      return mediasoupRouter;
    } catch (e) {
      this.logger.error(e)
    }
  }

  /**
   * 根据 routerId 查询 rtpCapabilities
   * @param { RouterDo } data routerId: router id
   * @returns
   */
  getRtpCapabilities(data: RouterDo) {
    // 获取缓存中的 router
    const router = this.get(data.routerId);
    if(!router) return
    return {
      routerId: data.routerId,
      rtpCapabilities: router.rtpCapabilities
    };
  }

  /**
   * 根据 routerId 查询 router
   * @param { string } id routerId
   * @returns
   */
  get(id: string) {
    // 从缓存中获取 router
    const router = MediaRouterService.routers.get(id);
    if (!router) {
      this.logger.warn(`缓存中没有找到 ${id} 此 mediarouter`);
      return
    }
    return router;
  }

  /**
   * 根据 routerId 删除 router
   * @param { RouterDo } data routerId: router id
   * @returns 
   */
  close(data: RouterDo) {
    try {
      // 获取缓存中的 router
      const router = this.get(data.routerId);
      if (!router) return
      // 关闭 router
      router.close();
      // 返回空对象
      return {};
    } catch (e) {
      this.logger.error(e)
    }
  }

  async delete(id: string) {
    const router = this.get(id);
    if (router) {
      router.close();
    }
  }

  async getRouters(data: { roomId: string }) {
    const mediaRouters = MediaRouterService.routers.keys()
    return mediaRouters
  }

  async getList() {
    const mediaRouters = MediaRouterService.routers.keys()
    console.log("%c Line:195 🥟 mediaRouters", "color:#42b983", mediaRouters);
    return mediaRouters
  }
}
