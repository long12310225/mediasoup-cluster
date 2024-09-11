import { EventEmitter } from 'events';

export default class EnhancedEventEmitter extends EventEmitter {

  constructor() {
    super();
    this.setMaxListeners(Infinity);
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
      console.error(
        'safeEmit() | event listener threw an error [event:%s]:%o',
        event,
        error,
      );
    }
  }

}
