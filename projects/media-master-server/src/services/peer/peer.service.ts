import { Injectable } from "@nestjs/common";
import { Peer } from "@/dao/peer/peer.do";

@Injectable()
export class PeerService {
  
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
    if (peer) {
      return peer
    }
    return
  }
}