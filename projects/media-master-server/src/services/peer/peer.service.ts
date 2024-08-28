import { logger } from '../../shared/modules/logger/logger';
import { Injectable } from "@nestjs/common";
import { Peer } from "@/dao/peer/peer.do";
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class PeerService {
  constructor(
    @InjectPinoLogger(PeerService.name)
    private readonly logger: PinoLogger,
  ) { }

  /**
   * 创建 peer
   * @param data 
   */
  public createPeer(data: {
    peerId: string,
    routerId: string,
    roomId: string
  }) {
    const peer = new Peer()
    peer.id = data.peerId
    peer.routerId = data.routerId || ''
    // peer.roomId = data.roomId || ''
    Peer.getRepository().save(peer)
  }

  /**
   * 查询 peer
   */
  public async getPeer(data: { peerId: string }) {
    const peer = await Peer.getRepository().findOne({
      relations: {
        router: true
      },
      where: {
        id: data.peerId
      }
    })
    if (!peer) {
      this.logger.error('peer not found');
      return;
    }
    return peer
  }
}