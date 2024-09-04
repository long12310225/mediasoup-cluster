import { Injectable } from '@nestjs/common';
import { types } from 'mediasoup';
import { RouterService } from '../router/router.service';
import { RoomService } from '../room/room.service';
import { PeerService } from '../peer/peer.service';
import { MediaTransport } from '../../dao/transport/media.transport.do';
import { MediaWorker } from '../../dao/worker/media.worker.do';
import { CONSTANTS } from '../../common/enum';
import { WebRtcTransportData } from '@/types';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { CreateTransportDo, TransportDo, PlainTransportDo } from '@/dto';
import { AxiosService } from '@/shared/modules/axios';

@Injectable()
export class TransportService {
  constructor(
    @InjectPinoLogger(TransportService.name)
    private readonly logger: PinoLogger,
    private readonly routerService: RouterService,
    private readonly roomService: RoomService,
    private readonly peerService: PeerService,
    private readonly axiosService: AxiosService
  ) { }

  /**
   * 创建 producer transport
   * @param data 
   * @returns 
   */
  public async createProducerTransport(data: CreateTransportDo): Promise<WebRtcTransportData> {
    // 根据 roomId 获取 room
    const room = await this.roomService.getRoom({
      roomId: data.roomId,
    });

    // 发起 http 请求，访问 producer 服务器（转发）
    const result = await this.axiosService.fetchApi({
      host: room.worker.apiHost,
      port: room.worker.apiPort,
      path: '/routers/:routerId/producer_transports',
      method: 'POST',
      data: {
        routerId: room.routerId,
        webRtcTransportOptions: data.webRtcTransportOptions,
        peerId: data?.peerId
      },
    });

    if(!result) return

    // 创建 entity 实例
    const mediaTransport = new MediaTransport();
    mediaTransport.id = result.id;
    mediaTransport.routerId = room.routerId;
    mediaTransport.workerId = room.worker.id;
    mediaTransport.type = CONSTANTS.PRODUCER;
    mediaTransport.roomId = room.id;

    /*
     存贮到数据库

     通过 this.entityManager 获取数据库管理者 manager，
     链式调用 getRepository 函数，并传入相关entiry实体类，
     链式调用 save 函数，将 mediaTransport 数据保存至数据库
     */
    await MediaTransport.getRepository().save(mediaTransport);
    // 修改 media_worker 表数据
    MediaWorker.getRepository().increment({ id: room.workerId }, 'transportCount', 1);
    
    // 返回 producer 的数据
    return result;
  }

  // /**
  //  * 创建 consumer transport
  //  * @param data 
  //  * @returns 
  //  */
  // public async createConsumerTransport(data: {
  //   routerId: string;
  //   webRtcTransportOptions: any;
  //   peerId: string;
  // }): Promise<{
  //   id: string;
  //   iceParameters: types.IceParameters;
  //   iceCandidates: types.IceCandidate[];
  //   dtlsParameters: types.DtlsParameters;
  //   sctpParameters: types.SctpParameters;
  // }> {
  //   // 创建 router service 实例，并调用使用方法 get 查询数据库的 router
  //   const router = await this.routerService.get({
  //     routerId: data.routerId,
  //   })
    
  //   // 发起 http 访问，访问 consumer 服务器（转发）
  //   const result = await this.axiosService.fetchApi({
  //     host: router.worker.apiHost,
  //     port: router.worker.apiPort,
  //     path: '/routers/:routerId/consumer_transports',
  //     method: 'POST',
  //     data: {
  //       routerId: router.id,
  //       webRtcTransportOptions: data.webRtcTransportOptions,
  //       peerId: data.peerId
  //     },
  //   });

  //   // 创建 mediaTransport 实例存放数据
  //   const mediaTransport = new MediaTransport();
  //   mediaTransport.id = result.id;
  //   mediaTransport.routerId = router.id;
  //   mediaTransport.workerId = router.worker.id;
  //   mediaTransport.type = CONSTANTS.CONSUMER;
  //   mediaTransport.roomId = router.roomId;

  //   /*
  //     存贮到数据库
 
  //     通过 this.entityManager 获取数据库管理者 manager，
  //     链式调用 getRepository 函数，并传入相关entiry实体类，
  //     链式调用 save 函数，将 mediaTransport 数据保存至数据库
  //   */
  //   await MediaTransport.getRepository().save(mediaTransport);
  //   // 根据对应的 wordId 向该条目修改数据
  //   MediaWorker.getRepository().increment({ id: router.workerId }, 'transportCount', 1);
    
  //   // 返回 http 访问结果
  //   return result;
  // }

  /**
   * 创建 consumer transport
   * @param data 
   * @returns 
   */
  public async createConsumerTransport(data: CreateTransportDo): Promise<WebRtcTransportData> {
    const timestrap = new Date().getTime()

    console.time(`${timestrap} createConsumerTransport函数 this.peerService.getPeer耗时`)
    const peer = await this.peerService.getPeer({ 
      peerId: data.peerId
    })
    console.timeEnd(`${timestrap} createConsumerTransport函数 this.peerService.getPeer耗时`)
    if (!peer?.router?.id) {
      this.logger.error('TransportService createConsumerTransport函数 没有找到 peer')
      return
    }

    console.time(`${timestrap} createConsumerTransport函数 this.routerService.get耗时`)
    const router = await this.routerService.get({
      routerId: peer.router.id
    })
    console.timeEnd(`${timestrap} createConsumerTransport函数 this.routerService.get耗时`)
    if (!router?.id) {
      this.logger.error('this.roomService.getRoom() 没有找到router')
      return
    }

    console.time(`${timestrap} createConsumerTransport函数 fetchApi耗时`)
    // 发起 http 访问，访问 consumer 服务器（转发）
    const result = await this.axiosService.fetchApi({
      host: router.worker.apiHost,
      port: router.worker.apiPort,
      path: '/routers/:routerId/consumer_transports',
      method: 'POST',
      data: {
        routerId: router.id,
        webRtcTransportOptions: data.webRtcTransportOptions,
        peerId: data?.peerId
      },
    });
    console.timeEnd(`${timestrap} createConsumerTransport函数 fetchApi耗时`)

    if(!result) return

    // 创建 mediaTransport 实例存放数据
    const mediaTransport = new MediaTransport();
    mediaTransport.id = result.id;
    mediaTransport.routerId = router.id;
    mediaTransport.workerId = router.worker.id;
    mediaTransport.type = CONSTANTS.CONSUMER;
    mediaTransport.roomId = router.roomId;

    /*
      存贮到数据库

      通过 this.entityManager 获取数据库管理者 manager，
      链式调用 getRepository 函数，并传入相关entiry实体类，
      链式调用 save 函数，将 mediaTransport 数据保存至数据库
    */
    console.time(`${timestrap} createConsumerTransport函数 MediaTransport.getRepository().save耗时`)
    await MediaTransport.getRepository().save(mediaTransport);
    console.timeEnd(`${timestrap} createConsumerTransport函数 MediaTransport.getRepository().save耗时`)

    // worker 根据对应的 wordId 给 transportCount +1
    MediaWorker.getRepository().increment({ id: router.workerId }, 'transportCount', 1);
    
    // 返回 http 访问结果
    return result;
  }

  /**
   * 连接 producer
   * @param data 
   * @returns {}
   */
  public async connectProducer(data: {
    transportId: string;
    dtlsParameters: any
  }) {
    // 从数据库找到对应 transport
    const transport = await this.get({ transportId: data.transportId });
    if (!transport) return
    
    // 是 producer 类型就转发
    if (transport.type === CONSTANTS.PRODUCER) {
      const res = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: `/producer_transports/:transportId/connect`,
        method: 'POST',
        data: {
          transportId: transport.id,
          dtlsParameters: data.dtlsParameters,
        },
      });

      // 返回一个空对象
      return {};
    }
    this.logger.error('Invalid type producer transport');
    return
  }

  /**
   * 连接 consumer
   * @param data 
   * @returns {}
   */
  public async connectConsumer(data: {
    transportId: string;
    dtlsParameters: any
  }) {
    // 获取 transport
    const transport = await this.get({ transportId: data.transportId });
    if (!transport) return

    // 如果类型是 'consumer'
    if (transport.type === CONSTANTS.CONSUMER) {
      // 发起 http，发送 transportId，连接 transport
      await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: `/consumer_transports/:transportId/connect`,
        method: 'POST',
        data: {
          transportId: transport.id,
          dtlsParameters: data.dtlsParameters,
        },
      });
      // 返回一个空对象
      return {};
    }
    this.logger.error('Invalid type consumer transport');
    return
  }

  /**
   * producer webRTCTransport restartIce params
   * @param { TransportDo } data 
   * @returns 
   */
  public async webRtcTransportRestartIceProducer(data: TransportDo) {
    // 从数据库找到对应 transport
    const transport = await this.get({ transportId: data.transportId });
    if (!transport) return
    
    // 如果类型是 'producer'
    if (transport.type === CONSTANTS.PRODUCER) { 
      // 发起 http，发送 transportId，连接 transport
      const webRTCTransport = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: `/producer_webrtctransports/:transportId/restartIce`,
        method: 'POST',
        data: {
          transportId: transport.id,
        },
      });

      if(!webRTCTransport) return

      return webRTCTransport;
    }
    this.logger.error('Invalid type producer transport');
    return
  }

  /**
   * consumer webRTCTransport restartIce params
   * @param { TransportDo } data 
   * @returns 
   */
  public async webRtcTransportRestartIceConsumer(data: TransportDo) {
    // 从数据库找到对应 transport
    const transport = await this.get({ transportId: data.transportId });
    if(!transport) return

    // 如果类型是 'consumer'
    if (transport.type === CONSTANTS.CONSUMER) {
      // 发起 http，发送 transportId，连接 transport
      const webRTCTransport = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: `/consumer_webrtctransports/:transportId/restartIce`,
        method: 'POST',
        data: {
          transportId: transport.id,
        },
      });
      
      if(!webRTCTransport) return

      return webRTCTransport;
    }
    this.logger.error('Invalid type consumer transport');
    return
  }

  /**
   * 根据 transportId 获取 transport
   * @param data 
   * @returns { {
   *    id: '4ae67076-ff4d-4237-a32f-1653b05861a5',
   *    workerId: '736c417d-c835-4c38-b4a2-23f31e68f31a',
   *    roomId: 'b3f8c86d-c1fb-4a44-a1a5-9f54e89ea3d0',
   *    routerId: '9ca45efc-9350-4e2e-ba00-fd49d3923b11',
   *    type: 'producer',
   *    createDate: 2024-07-12T06:01:58.322Z,
   *    worker: MediaWorker {
   *      id: '736c417d-c835-4c38-b4a2-23f31e68f31a',
   *      apiHost: '10.2.106.31',
   *      for: 'producer',
   *      apiPort: 3011,
   *      pid: 15470,
   *      maxTransport: 500,
   *      transportCount: 1,
   *      errorCount: 0
   *    }
   *  }
   * } media_transport 表中一条 transport 数据
   */
  public async get(data: TransportDo) {
    // 查找数据库
    const transport = await MediaTransport
      .getRepository()
      .findOne({
        // 联合 worker 查询
        relations: { worker: true },
        where: { id: data.transportId },
      });
    if (!transport) {
      this.logger.error('transport not found');
      return
    }
    return transport;
  }

  /**
   * 根据 roomId 从数据库中找到 producers
   * @param data 
   * @returns 
   */
  async getProducers(data: { roomId: string }): Promise<{
    items: Array<{
      id: string;
      producers: Array<{ id: string; kind: string }>;
    }>;
  }> {
    // 从数据库查出 transport
    const items = (await MediaTransport.getRepository().find({
      relations: { producers: true },
      select: [
        'id',
        'producers',
      ],
      where: {
        roomId: data.roomId,
        type: CONSTANTS.PRODUCER,
      },
    })) as any;
    return { items };
  }

  // create consumer same host with producer
  async createSameHostConsumer(data: {
    roomId: string;
  }): Promise<{
    id: string;
    iceParameters: types.IceParameters;
    iceCandidates: types.IceCandidate[];
    dtlsParameters: types.DtlsParameters;
  }> {
    const room = await this.roomService.getRoom({
      roomId: data.roomId,
    });
    const result = await this.axiosService.fetchApi({
      host: room.worker.apiHost,
      port: room.worker.apiPort,
      path: '/routers/:routerId/consumer_transports',
      method: 'POST',
      data: { routerId: room.routerId },
    });

    if(!result) return

    const mediaTransport = new MediaTransport();
    mediaTransport.id = result.id;
    mediaTransport.routerId = room.routerId;
    mediaTransport.workerId = room.worker.id;
    mediaTransport.type = CONSTANTS.CONSUMER;
    mediaTransport.roomId = room.id;

    await MediaTransport.getRepository().save(mediaTransport);
    MediaWorker.getRepository().increment({ id: room.workerId }, 'transportCount', 1);

    return result;
  }

  /**
   * 根据 transportId 关闭指定 transport
   * @param { TransportDo } data 
   * @returns 
   */
  public async close(data: TransportDo) {
    const transport = await this.get(data);
    if (!transport) return
    
    await this.closeTransport(transport);

    return {};
  }

  /**
   * 关闭 MediaTransport
   * @param { MediaTransport } transport 
   */
  public async closeTransport(transport: MediaTransport) {
    // 发送 http 请求，关闭 transport
    try {
      await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path:
          transport.type === CONSTANTS.CONSUMER
            ? `/consumer_transports/:transportId`
            : `/producer_transports/:transportId`,
        method: 'DELETE',
        data: {
          transportId: transport.id
        }
      });
    } catch (e) {
      this.logger.error(e)
    }

    // 从数据库中，删除对应transport
    await MediaTransport
    .getRepository()
      .delete({ id: transport.id });
    
    // 从数据库中，操作 worker 表 transportCount 字段
    await MediaWorker
      .getRepository()
      .decrement({ id: transport.workerId }, 'transportCount', 1);
  }

  /**
   * 创建 plain transport
   * @param data 
   */
  public async createPlainTransport(data: {
    roomId: string;
    plainTransportOptions: any;
  }): Promise<WebRtcTransportData> {
    // 根据 roomId 获取 room
    const room = await this.roomService.getRoom({
      roomId: data.roomId,
    });

    // 发起 http 请求，访问 producer 服务器（转发）
    const result = await this.axiosService.fetchApi({
      host: room.worker.apiHost,
      port: room.worker.apiPort,
      path: '/routers/:routerId/create_plain_transports',
      method: 'POST',
      data: {
        routerId: room.routerId,
        plainTransportOptions: data.plainTransportOptions,
      },
    });

    if(!result) return

    // 创建 entity 实例
    const mediaTransport = new MediaTransport();
    mediaTransport.id = result.id;
    mediaTransport.routerId = room.routerId;
    mediaTransport.workerId = room.worker.id;
    mediaTransport.type = CONSTANTS.PRODUCER;
    mediaTransport.roomId = room.id;

    /*
     存贮到数据库

     通过 this.entityManager 获取数据库管理者 manager，
     链式调用 getRepository 函数，并传入相关entiry实体类，
     链式调用 save 函数，将 mediaTransport 数据保存至数据库
     */
    await MediaTransport.getRepository().save(mediaTransport);
    
    return result;
  }

  /**
   * 连接 plainTransport
   * @param data 
   * @returns {}
   */
  public async connectPlainTransport(data: PlainTransportDo) {
    console.log("%c Line:198 🍪 4 连接 transport -- connectPlainTransport data: ", "color:#2eafb0", data);
    
    // 从数据库找到对应 transport
    const transport = await this.get({ transportId: data.transportId });
    console.log("%c Line:198 🍪 4 连接 transport -- transport: ", "color:#2eafb0", transport);
    if(!transport) return

    if (transport.type === CONSTANTS.PRODUCER) {
      const res = await this.axiosService.fetchApi({
        host: transport.worker.apiHost,
        port: transport.worker.apiPort,
        path: `/plain_transports/:transportId/connect`,
        method: 'POST',
        data: {
          transportId: transport.id,
          ip: data.ip,
          port: data.port,
          rtcpPort: data.rtcpport,
        },
      });
      console.log("%c Line:198 🍪 4 连接 transport -- connectPlainTransport res == {} ", "color:#2eafb0", res);

      return {};
    }
    this.logger.error('Invalid type plain transport');
    return
  }
}
