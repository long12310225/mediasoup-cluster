/**
 * WebSocketTransport 与 websocket 的 connection 对象的关系：
 * -- 此类中所有内容，均取自于 connection，是connection的二次封装
 */

import EnhancedEventEmitter from '../utils/EnhancedEventEmitter';
import Message from '../utils/Message';
import { MessageParse } from '../utils/utils'
import * as chalk from 'chalk';

export default class WebSocketTransport extends EnhancedEventEmitter {
  /**
   * Closed flag
   * @type {Boolean}
   */
  private _closed: boolean;
  
  /**
   * WebSocketConnection instance.
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
    super();

    this._closed = false;
    this._connection = connection;
    this._socket = connection.socket;

    // Handle connection.
    this._handleConnection();
  }

  /**
   * 监听 WebSocketConnection 事件
   */
  private _handleConnection() {

    /**
     * 监听 connection 的 close 事件
     * 为该事件添加 _closed 标记
     */
    this._connection.on('close', (code, reason) => {
      if (this._closed) return;
      
      // 标记为关闭（重新开启需要关闭浏览器页签重新打开连接）
      this._closed = true;

      console.debug('WebSocketTransport _handleConnection() | 触发 ws close 事件，关闭 ws [conn:%s, code:%d, reason:"%s"]', this, code, reason);

      // Emit 'close' event.
      this.safeEmit('close');
    });

    /**
     * 监听 connection 的 error 事件
     */
    // this._connection.on('error', (error) => {
    //   console.error('WebSocketTransport _handleConnection() | this._connection "error" event [conn:%s, error:%s]', this, error);
    // });

    /**
     * 监听 connection 的 message 事件
     * - 为该事件过滤掉二进制类型的消息
     * - 格式化消息
     */
    this._connection.on('message', (raw) => {
      // 排除掉二进制类型的消息
      if (raw.type === 'binary') {
        console.warn('WebSocketTransport _handleConnection() | ignoring received binary message [conn:%s]', this);
        return;
      }
      // 【重要】接收消息
      const message = MessageParse(raw.utf8Data);

      if (!message) return;

      if (this.listenerCount('message') === 0) {
        console.error('WebSocketTransport _handleConnection() | no listeners for "message" event, ignoring received message');
        return;
      }

      // Emit 'message' event.
      // console.log("%c Line:83 🥑 接收客户端消息 message =>", "color:#465975", message);
      this.safeEmit('message', message);
    });
  }

  /**
   * 发送消息给客户端
   * @param message 消息体
   */
  public async send(message) {
    if (this._closed) { 
      console.info(chalk.red('用户连接已关闭, 请重新连接!!!'));
      return
    }

    try {
      this._connection.sendUTF(JSON.stringify(message));
    } catch (error) {
      console.info(chalk.red('消息发送失败 ==> '), error);
    }
  }

  /**
   * 关闭连接
   */
  public close() {
    if (this._closed) return;

    // Don't wait for the WebSocket 'close' event, do it now.
    this._closed = true;
    this.safeEmit('close');

    try {
      this._connection.close(4000, 'closed by protoo-server');
    } catch (error) {
      console.error('WebSocketTransport close() | error closing the connection: %s', error);
      throw error;
    }
  }

  public get closed() {
    return this._closed;
  }
  public get connection() {
    return this._connection;
  }

  public toString() {
    return (
      this._tostring ||
      (this._tostring = `${this._socket.encrypted ? 'WSS' : 'WS'}:[${
        this._socket.remoteAddress
      }]:${this._socket.remotePort}`)
    );
  }
}
