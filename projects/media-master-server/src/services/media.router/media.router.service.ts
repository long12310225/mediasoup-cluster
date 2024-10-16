import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { types } from 'mediasoup';
import { mediasoupWorkerManager } from '../../shared/libs/worker';
import env from '@/config/env';

@Injectable()
export class MediaRouterService {
  // 缓存 router
  static routers = new Map<string, types.Router>();

  /**
   * 创建 mediasoup router
   * @param { { pid: number } } data
   * @returns
   */
  async create(data: { pid: number }) {
    // 获取 pid 指定 mediasoup worker
    const mediasoupWorker = mediasoupWorkerManager.get(data.pid);

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
  }

  /**
   * 创建 mediasoup router，并缓存
   * @param { { pid: number } } data
   * @returns
   */
  static async createMediasoupRouter(data: { pid: number }) {
    // 获取 pid 指定 mediasoup worker
    const mediasoupWorker = mediasoupWorkerManager.get(data.pid);

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

    // 返回响应体
    return mediasoupRouter;
  }

  /**
   * 根据 routerId 查询 rtpCapabilities
   * @param { { routerId: string } } data routerId: router id
   * @returns
   */
  getRtpCapabilities(data: { routerId: string }) {
    // 获取缓存中的 router
    const router = this.get(data.routerId);
    return { rtpCapabilities: router.rtpCapabilities };
  }

  /**
   * 根据 routerId 查询 router
   * @param { string } id routerId
   * @returns
   */
  get(id: string) {
    // 从缓存中获取 router
    const router = MediaRouterService.routers.get(id);
    if (router) {
      return router;
    }
    throw new Error('Router not found');
  }

  /**
   * 根据 routerId 删除 router
   * @param { { routerId: string } } data routerId: router id
   * @returns 
   */
  close(data: { routerId: string }) {
    // 获取缓存中的 router
    const router = this.get(data.routerId);
    // 关闭 router
    router.close();
    // 返回空对象【FIX】
    return {};
  }

  async delete(id: string) {
    const router = this.get(id);
    if (router) {
      router.close();
    }
  }
}
