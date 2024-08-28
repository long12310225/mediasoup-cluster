/**
 * Room 与 Peer 的关系:
 * -- 此 Room 是用于存放 Peer 的一个集合类，代表这个房间存在了哪些人
 */

import EnhancedEventEmitter from '../utils/EnhancedEventEmitter';
import Peer from './Peer';

export class Room extends EnhancedEventEmitter {
  /**
   * Room id
   * @type {String}
   */
  private _roomId: string;
  
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

  private _mediaRoom: any

  constructor({ roomId, mediaRoom }) {
    super();
    this._roomId = roomId;
    this._closed = false;
    this._peers = new Map();
    this._mediaRoom = mediaRoom
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
   * @param {protoo.Transport} protooWebSocketTransport protooWebSocketTransport
   *
   * @returns {Peer}
   * @throws {TypeError} if wrong parameters.
   * @throws {Error} if Peer with same peerId already exists.
   */
  createPeer(peerId, protooWebSocketTransport, serverType) {
    if (!protooWebSocketTransport) throw new TypeError('no protooWebSocketTransport given');

    // 判断 peerId 非空
    if (typeof peerId !== 'string' || !peerId) {
      protooWebSocketTransport.close();
      throw new TypeError('peerId must be a string');
    }

    // 判断是否存在对应的 peer
    if (this._peers.has(peerId)) {
      protooWebSocketTransport.close();

      throw new Error(
        `there is already a Peer with same peerId [peerId:"${peerId}"]`,
      );
    }

    // 初始化 peer
    // Create the Peer instance.
    const peer = new Peer(peerId, protooWebSocketTransport, serverType);

    // 缓存 peer
    // Store it in the map.
    this._peers.set(peer.id, peer);

    // 监听 peer 的 close 事件，当触发时，就从缓存中删除
    peer.on('close', () => {
      this._peers.delete(peerId)
    });

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

  get roomId() {
    return this._roomId
  }
  
  get mediaRoom() {
    return this._mediaRoom
  }
}
