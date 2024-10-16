/**
 * WebSocketTransport 与 websocket 的 connection 对象的关系：
 * -- 此类中所有内容，均取自于 connection
 */

import Logger from '../utils/Logger';
import EnhancedEventEmitter from '../utils/EnhancedEventEmitter';
import Message from '../utils/Message';
import { MessageParse } from '../utils/utils'

const logger = new Logger('WebSocketTransport');

export default class WebSocketTransport extends EnhancedEventEmitter {
  /**
   * Closed flag.
   * @type {Boolean}
   */
  private _closed: boolean;
  /**
   * WebSocket cnnection instance.
   * @type {WebSocket-Node.WebSocketConnection}
   */
  private _connection: any;
  /**
   * Socket instance.
   * @type {net.Socket}
   */
  private _socket: any;
  private _tostring: string;

  constructor(connection) {
    super(logger);

    this._closed = false;
    this._connection = connection;
    this._socket = connection.socket;

    // Handle connection.
    this._handleConnection();
  }

  /**
   * 连接 ws
   */
  _handleConnection() {
    // 监听 connection 的 close 事件
    this._connection.on('close', (code, reason) => {
      if (this._closed) return;

      this._closed = true;

      logger.debug(
        'connection "close" event [conn:%s, code:%d, reason:"%s"]',
        this,
        code,
        reason,
      );

      // Emit 'close' event.
      this.safeEmit('close');
    });

    // 监听 connection 的 error 事件
    this._connection.on('error', (error) => {
      logger.error('connection "error" event [conn:%s, error:%s]', this, error);
    });

    // 监听 connection 的 message 事件
    this._connection.on('message', (raw) => {
      if (raw.type === 'binary') {
        logger.warn('ignoring received binary message [conn:%s]', this);
        return;
      }
      // 【重要】接收消息
      const message = MessageParse(raw.utf8Data);

      if (!message) return;

      if (this.listenerCount('message') === 0) {
        logger.error(
          'no listeners for "message" event, ignoring received message',
        );
        return;
      }

      // Emit 'message' event.
      console.log("%c Line:83 🥑 接收客户端消息 message =>", "color:#465975", message);
      this.safeEmit('message', message);
    });
  }

  /**
   * 发送消息给客户端
   * @param message 消息体
   */
  async send(message) {
    if (this._closed) throw new Error('transport closed');

    try {
      this._connection.sendUTF(JSON.stringify(message));
    } catch (error) {
      logger.error('send() failed:%o', error);
      throw error;
    }
  }

  /**
   * 关闭连接
   */
  close() {
    if (this._closed) return;

    // Don't wait for the WebSocket 'close' event, do it now.
    this._closed = true;
    this.safeEmit('close');

    try {
      this._connection.close(4000, 'closed by protoo-server');
    } catch (error) {
      logger.error('close() | error closing the connection: %s', error);
      throw error;
    }
  }

  get closed() {
    return this._closed;
  }
  get connection() {
    return this._connection;
  }

  toString() {
    return (
      this._tostring ||
      (this._tostring = `${this._socket.encrypted ? 'WSS' : 'WS'}:[${
        this._socket.remoteAddress
      }]:${this._socket.remotePort}`)
    );
  }
}
