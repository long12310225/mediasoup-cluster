/**
 * WebSocketServer 与 WebSocketTransport 的关系：
 * -- 通过 this._wsServer.on('request', (req) => req) 的 req 获取到 connection 对象，并传给 WebSocketTransport 初始化
 * -- WebSocketServer 将 WebSocketTransport 实例 回调出去，传给 Peer
 */

const websocket = require('websocket');
import EnhancedEventEmitter from '../utils/EnhancedEventEmitter';
import WebSocketTransport from './WebSocketTransport';
import env from '@/config/env';

// 协议
const WS_SUBPROTOCOL = env.getEnv('WS_SUBPROTOCOL');

export class WebSocketServer extends EnhancedEventEmitter {
  /**
   * Run a WebSocket server instance.
   * @type {WebSocket-Node.WebSocketServer}
   */
  private _wsServer: any;

  /**
   * 初始化 ws 实例，并监听 request 事件
   *
   * @param {http.Server} httpServer - Node HTTP/HTTPS compatible server.
   * @param {Object} [options] - Options for WebSocket-Node.WebSocketServer.
   *
   * @emits {info: Object, accept: Function, reject: Function} connectionrequest
   */
  constructor(httpServer, options) {
    super();

    // Merge some settings into the given options.
    options = Object.assign({
      httpServer: httpServer,
      keepalive: true,
      keepaliveInterval: env.getEnv('WS_KEEPALIVE_INTERVAL') || 60000,
      ...options,
    });

    // 初始化 ws 实例
    this._wsServer = new websocket.server(options);

    // 监听 request 事件
    this._wsServer.on('request', (request) => this._onRequest(request));
  }

  /**
   * 将 request 事件再封装一层，
   * 添加一些校验规则，
   * 并发送 'connectionrequest' 事件
   * @param request WebSocketRequest 实例。API：docs/webSocket API/WebSocketRequest.md
   * @returns
   */
  private _onRequest(request) {
    console.debug('WebSocketServer _onRequest() [origin:%s | path:"%s"]', request.origin, request.resource);

    // NOTE: To avoid https://github.com/theturtle32/WebSocket-Node/issues/351
    // in Node 10.
    // request.httpRequest.socket.on('error', (e) => {
    //   console.error("WebSocketServer _onRequest() | request.httpRequest.socket: ", e);
    // });

    // Validate WebSocket sub-protocol.
    if (request.requestedProtocols.indexOf(WS_SUBPROTOCOL) === -1) {
      console.warn('WebSocketServer _onRequest() | invalid/missing Sec-WebSocket-Protocol');
      request.reject(403, 'invalid/missing Sec-WebSocket-Protocol');
      return;
    }

    // If there are no listeners, reject the request.
    if (this.listenerCount('connectionrequest') === 0) {
      console.error('WebSocketServer _onRequest() | no listeners for "connectionrequest" event, ' + 'rejecting connection request');
      request.reject(500, 'no listeners for "connectionrequest" event');
      return;
    }

    let replied = false;

    try {
      // 发送 'connectionrequest' 事件
      this.emit('connectionrequest',
        // Connection data.
        {
          request: request.httpRequest,
          origin: request.origin,
          socket: request.httpRequest.socket,
        },
        // accept() function.
        () => {
          if (replied) {
            console.warn('WebSocketServer _onRequest() | cannot call accept(), connection request already replied');
            return;
          }

          replied = true;

          /**
           * Get the WebSocketConnection instance.
           * ws 传输对象。内置发送消息（send方法），接收消息监听事件（message事件），关闭连接监听事件（close事件）
           */
          const connection = request.accept(WS_SUBPROTOCOL, request.origin);

          // Create a new Protoo WebSocket transport.
          const transport = new WebSocketTransport(connection);

          // console.info('WebSocketServer _onRequest() | accept() called ' + transport.toString());

          // Return the transport.
          return transport;
        },
        // reject() function.
        (code, reason) => {
          if (replied) {
            console.warn('WebSocketServer _onRequest() | cannot call reject(), connection request already replied');
            return;
          }

          if (code instanceof Error) {
            code = 500;
            reason = String(code);
          } else if (reason instanceof Error) {
            reason = String(reason);
          }

          replied = true;
          code = code || 403;
          reason = reason || 'Rejected';

          console.debug('WebSocketServer _onRequest() | reject() called [code:%s | reason:"%s"]', code, reason);

          request.reject(code, reason);
        },
      );
    } catch (error) {
      console.error('WebSocketServer _onRequest() |  error', error)
      request.reject(500, String(error));
    }
  }

  /**
   * 关闭 ws
   *
   * Stop listening for protoo WebSocket connections. This method does NOT
   * close the HTTP/HTTPS server.
   */
  public stop() {
    // Don't close the given http.Server|https.Server but just unmount the
    // WebSocket server.
    this._wsServer.unmount();
  }
}
