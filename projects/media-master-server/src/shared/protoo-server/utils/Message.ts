import Logger from './Logger';
import { generateRandomNumber } from './utils';

const logger = new Logger('Message');

export default class Message {
  /**
   * 创建一个 请求 数据
   * @param method 
   * @param data 
   * @returns 
   */
  public static createRequest(method, data) {
    const request = {
      request: true,
      id: generateRandomNumber(), // 随机数
      method: method,
      data: data || {},
    };

    return request;
  }
  
  /**
   * 创建一个 success 响应数据
   * @param request 
   * @param data 
   * @returns 
   */
  public static createSuccessResponse(request, data) {
    const response = {
      response: true,
      id: request.id,
      ok: true,
      data: data || {},
    };

    return response;
  }
  
  /**
   * 创建一个 error 响应数据
   * @param request 
   * @param errorCode 
   * @param errorReason 
   * @returns 
   */
  public static createErrorResponse(request, errorCode, errorReason) {
    const response = {
      response: true,
      id: request.id,
      errorCode: errorCode,
      errorReason: errorReason,
    };

    return response;
  }
  
  /**
   * 创建一个 notification 数据
   * @param method 
   * @param data
   * @returns 
   */
  public static createNotification(method, data) {
    const notification = {
      notification: true,
      method: method,
      data: data || {},
    };

    return notification;
  }
}
