/**
 * Peer 的作用：
 * -- 1、集中式缓存
 * 
 * _transport：WebSocketTransport的实例
 * -- 使用了属性: _closed 
 * -- 使用了方法: send、close 
 * -- 监听了事件: close、message 
 */

import EnhancedEventEmitter from '../utils/EnhancedEventEmitter';
import Message from '../utils/Message';
import env from '@/config/env';

export default class Peer extends EnhancedEventEmitter {
  /**
   * Closed flag.
   * @type {Boolean}
   */
  private _closed: boolean;

  /**
   * Peer id.
   * @type {String}
   */
  private _id: any;

  /**
   * 服务类型
   */
  private _serverType: any;

  /**
   * Transport.
   * @type {protoo.Transport}
   */
  private _transport: any;

  /**
   * Custom data object.
   * @type {{ 
   *   consume: any,
   *   joined: boolean, 是否加入了
   *   displayName: string,
   *   device: any,
   *   rtpCapabilities: any,
   *   sctpCapabilities: any,
   *   transports: Map,
   *   producers: Map,
   *   consumers: Map,
   *   dataProducers: Map,
   *   dataConsumers: Map,
   * }}
   */
  private _data: {};

  /**
   * Map of pending sent request objects indexed by request id.
   * @type {Map<Number, Object>}
   */
  private _sents: Map<any, any>;

  /**
   * @param {String} peerId
   * @param {protoo.Transport} transport protooWebSocketTransport
   *
   * @emits close
   * @emits {request: protoo.Request, accept: Function, reject: Function} request
   * @emits {notification: protoo.Notification} notification
   */
  constructor(peerId, transport, serverType) {
    super();
    this._closed = false;
    this._id = peerId;
    this._serverType = serverType;
    this._transport = transport;
    this._data = {};
    this._sents = new Map();

    this._handleTransport();
  }

  /**
   * 监听 WebSocketTransport 的事件
   */
  private _handleTransport() {
    // 如果 protooWebSocketTransport 已经关闭了，就标记为关闭，并发送 close 事件
    if (this._transport.closed) {
      this._closed = true;
      setImmediate(() => this.safeEmit('close'));
      return;
    }

    /**
     * 监听 WebSocketTransport 实例的 close 事件
     * - 标记 peer 用户为已关闭
     * - 通知 protooRoom 删除对应的 peer
     */
    this._transport.on('close', () => {
      if (this._closed) return;

      this._closed = true;

      this.safeEmit('close');
    });

    /**
     * 监听 protooWebSocketTransport 的 message 事件
     * - 当接收到消息时，判断消息类型，再执行不同的方法
     */
    this._transport.on('message', (message) => {
      if (message.request) {
        this._handleRequest(message);
      }
      else if (message.response) {
        this._handleResponse(message);
      }
      else if (message.notification) {
        this._handleNotification(message);
      }
    });
  }

  /**
   * 当接收到 request 类型消息，就发送 request 事件
   * @param request message 消息
   */
  private _handleRequest(request) {
    try {
      // 抛出 request 类型的消息事件
      this.emit(
        'request',
        // Request.
        request,
        // accept() function.
        (data) => {
          // 响应体
          const response = Message.createSuccessResponse(request, data);

          this._transport.send(response);
        },
        // reject() function.
        (errorCode, errorReason) => {
          if (errorCode instanceof Error) {
            errorReason = errorCode.message;
            errorCode = 500;
          } else if (
            typeof errorCode === 'number' &&
            errorReason instanceof Error
          ) {
            errorReason = errorReason.message;
          }

          const response = Message.createErrorResponse(
            request,
            errorCode,
            errorReason,
          );

          this._transport.send(response);
        },
      );
    } catch (error) {
      const response = Message.createErrorResponse(request, 500, String(error));

      this._transport.send(response);
    }
  }

  /**
   * 接收到 response 类型消息。
   *    先查询已存储的消息列表中，取出对应的 sent 消息对象
   *    再执行 sent 消息对象中的 resolve 方法，
   *    此时则会清空了之前的定时器，就会抛出错误了
   * @param response message 消息
   */
  private _handleResponse(response) {
    // 从缓存中取出某个 sent
    const sent = this._sents.get(response.id);

    // 判断非空
    if (!sent) {
      console.error('Peer | received response does not match any sent request [id:%s]', response.id);
      return;
    }

    // message 存在ok，就 resolve 掉 response.data；否则就抛出异常
    if (response.ok) {
      sent.resolve(response.data);
    } else {
      const error: any = new Error(response.errorReason);

      error.code = response.errorCode;
      sent.reject(error);
    }
  }

  /**
   * 发送一个 protoo request 给远端的 peer，等待约定时间内，接收回响应消息，否则超过约定时间，则会抛出异常
   * Send a protoo request to the remote Peer.
   *
   * @param {String} method
   * @param {Object} [data]
   *
   * @async
   * @returns {Object} The response data Object if a success response is received.
   */
  async request(method, data = undefined) {
    const request = Message.createRequest(method, data);

    // This may throw.
    // 发送消息
    await this._transport.send(request);

    return new Promise((pResolve, pReject) => {
      // 大概 30 秒后
      const timeout = 2000 * (15 + 0.1 * this._sents.size);

      // 创建一个 sent 对象
      const sent = {
        id: request.id,
        method: request.method,
        resolve: (data2) => {
          if (!this._sents.delete(request.id)) return;

          clearTimeout(sent.timer);
          pResolve(data2);
        },
        reject: (error) => {
          if (!this._sents.delete(request.id)) return;

          clearTimeout(sent.timer);
          pReject(error);
        },
        timer: setTimeout(() => {
          if (!this._sents.delete(request.id)) return;
          pReject(new Error('request timeout'));
        }, timeout),
        close: () => {
          clearTimeout(sent.timer);
          pReject(new Error('peer closed'));
        },
      };

      // 缓存 sent 对象
      // Add sent stuff to the map.
      this._sents.set(request.id, sent);
    }).catch((error) => {
      console.log("%c Line:255 🍌 error", "color:#ffdd4d", error);
    })
  }

  /**
   * 发送一个 protoo notification 给远端的 peer
   * Send a protoo notification to the remote Peer.
   *
   * @param {String} method
   * @param {Object} [data]
   *
   * @async
   */
  async notify(method, data = undefined) {
    const notification = Message.createNotification(method, data);

    // console.debug(`Peer notify() | [method: ${method}], [data: ${data}]`);

    // This may throw.
    // 发送消息
    await this._transport.send(notification);
  }

  /**
   * 当接收到 notification 类型消息，就发送 notification 事件
   * @param notification message 消息
   */
  private _handleNotification(notification) {
    this.safeEmit('notification', notification);
  }

  /**
   * 关闭 peer 和相关 transport
   *
   * Close this Peer and its Transport.
   */
  close() {
    if (this._closed) return;

    this._closed = true;

    // Close Transport.
    this._transport.close();

    // Close every pending sent.
    for (const sent of this._sents.values()) {
      sent.close();
    }

    // Emit 'close' event.
    this.safeEmit('close');
  }

  /**
   * Peer id
   *
   * @returns {String}
   */
  get id() {
    return this._id;
  }

  /**
   * Whether the Peer is closed.
   *
   * @returns {Boolean}
   */
  get closed() {
    return this._closed;
  }

  /**
   * App custom data.
   *
   * @returns {Object}
   */
  get data() {
    return this._data;
  }

  /**
   * Invalid setter.
   */
  set data(
    data, // eslint-disable-line no-unused-vars
  ) {
    throw new Error('cannot override data object');
  }

  get serverType() {
    return this._serverType
  }
}
