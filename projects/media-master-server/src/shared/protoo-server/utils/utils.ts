/**
 * Generates a random positive integer.
 *
 * @returns {Number}
 */
export const generateRandomNumber = function () {
  return Math.round(Math.random() * 10000000);
};

/**
 * 解析 message 数据
 * @param raw 
 * @returns 
 */
export const MessageParse = (raw) => {
  let object;
  const message: any = {};

  // 先将 message JSON.parse()解析成 json
  try {
    object = JSON.parse(raw);
  } catch (error) {
    console.error('parse() | invalid JSON: %s', error);
    return;
  }

  // 如果不是对象，直接返回
  if (typeof object !== 'object' || Array.isArray(object)) {
    console.error('parse() | not an object');
    return;
  }

  /**
   * request 类型
   * 拷贝对象
   */
  if (object.request) {
    message.request = true;

    if (typeof object.method !== 'string') {
      console.error('parse() | missing/invalid method field');
      return;
    }

    if (typeof object.id !== 'number') {
      console.error('parse() | missing/invalid id field');
      return;
    }

    message.id = object.id;
    message.method = object.method;
    message.data = object.data || {};
  }
  /**
   * response 类型
   * 拷贝对象
   */
  else if (object.response) {
    message.response = true;

    if (typeof object.id !== 'number') {
      console.error('parse() | missing/invalid id field');
      return;
    }

    message.id = object.id;

    // Success.
    if (object.ok) {
      message.ok = true;
      message.data = object.data || {};
    }
    // Error.
    else {
      message.ok = false;
      message.errorCode = object.errorCode;
      message.errorReason = object.errorReason;
    }
  }
  /**
   * notification 类型
   * 拷贝对象
   */
  else if (object.notification) {
    message.notification = true;

    if (typeof object.method !== 'string') {
      console.error('parse() | missing/invalid method field');
      return;
    }

    message.method = object.method;
    message.data = object.data || {};
  }
  /**
   * 其他类型，返回 undefined
   */
  else {
    console.error('parse() | missing request/response field');
    return;
  }

  return message;
}
