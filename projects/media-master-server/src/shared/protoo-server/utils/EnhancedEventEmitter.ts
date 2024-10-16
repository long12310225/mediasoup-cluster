import { EventEmitter } from 'events';
import Logger from './Logger';

export default class EnhancedEventEmitter extends EventEmitter {
  public _logger: any;

  constructor(logger) {
    super();
    this.setMaxListeners(Infinity);
    this._logger = logger || new Logger('EnhancedEventEmitter');
  }

  /**
   * 给 this.emit() 包一层 try catch
   * @param event 
   * @param args 
   */
  safeEmit(event, ...args) {
    try {
      this.emit(event, ...args);
    } catch (error) {
      this._logger.error(
        'safeEmit() | event listener threw an error [event:%s]:%o',
        event,
        error,
      );
    }
  }

}
