/**
 * Room 与 Peer 的关系:
 * -- 此 Room 仅仅是用于存放 Peer 的一个集合类，并无其他用途
 */

import Logger from '../utils/Logger';
import EnhancedEventEmitter from '../utils/EnhancedEventEmitter';
import Peer from './Peer';

const logger = new Logger('Room');

export default class Room extends EnhancedEventEmitter {
  /**
   * Closed flag.
   * @type {Boolean}
   */
  private _closed: boolean;

  /**
   * 存放 peer 的集合
   * Map of Peers indexed by id.
   * @type {Map<String, Peer>}
   */
  private _peers: Map<any, any>;

  constructor() {
    super(logger);
    this._closed = false;
    this._peers = new Map();
  }

  /**
   * 关闭 peer
   * Clsoe the Room.
   */
  close() {
    if (this._closed) return;

    this._closed = true;

    // Close all Peers.
    for (const peer of this._peers.values()) {
      peer.close();
    }

    // Emit 'close' event.
    this.safeEmit('close');
  }

  /**
   * 创建一个 peer
   * Create a Peer.
   *
   * @param {String} peerId
   * @param {protoo.Transport} transport protooWebSocketTransport
   *
   * @returns {Peer}
   * @throws {TypeError} if wrong parameters.
   * @throws {Error} if Peer with same peerId already exists.
   */
  createPeer(peerId, transport) {
    logger.debug('createPeer() [peerId:%s, transport:%s]', peerId, transport);

    if (!transport) throw new TypeError('no transport given');

    // 判断 peerId 非空
    if (typeof peerId !== 'string' || !peerId) {
      transport.close();
      throw new TypeError('peerId must be a string');
    }

    // 判断是否存在对应的 peer
    if (this._peers.has(peerId)) {
      transport.close();

      throw new Error(
        `there is already a Peer with same peerId [peerId:"${peerId}"]`,
      );
    }

    // 初始化 peer
    // Create the Peer instance.
    const peer = new Peer(peerId, transport);

    // 缓存 peer
    // Store it in the map.
    this._peers.set(peer.id, peer);

    // 监听 peer 的 close 事件，当触发时，就从缓存中删除
    peer.on('close', () => this._peers.delete(peerId));

    return peer;
  }

  /**
   * 判断是否存在某个 peer
   * Whether the Room has a Peer with given peerId.
   *
   * @returns {Booelan}
   */
  hasPeer(peerId) {
    return this._peers.has(peerId);
  }

  /**
   * 根据 peerId 获取 peer
   * Retrieve the Peer with  given peerId.
   *
   * @returns {Peer|Undefined}
   */
  getPeer(peerId) {
    return this._peers.get(peerId);
  }

  /**
   * Whether the Room is closed.
   *
   * @returns {Boolean}
   */
  get closed() {
    return this._closed;
  }

  /**
   * Get the list of conneted Peers.
   *
   * @returns {Array<Peer>}
   */
  get peers() {
    return Array.from(this._peers.values());
  }
}
