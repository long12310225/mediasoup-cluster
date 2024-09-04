import Redis from 'ioredis';

export class RedisPro extends Redis {
  constructor(options) {
    super(options)
  }
  
  /**
   * 保存单条数据
   * @param tableName 
   * @param data 
   * @returns 
   */
  public async saveOne(tableName: string, data: { 
    id: string
  }) {
    if (data.toString.call(this) !== '[object Object]') {
      throw new Error('data参数请传入对象类型!!!')
    }
    const obj = super.hgetall(tableName);
    const len = Object.keys(obj).length;
    return await super.hset(tableName, {
      [data.id]: JSON.stringify(data),
    });
  };

  public async findOne(tableName: string, key: string) {
    const data = await super.hget(tableName, key)
    return JSON.parse(data)
  }

  /**
   * 加锁操作
   * @param key 锁键
   * @param value 锁值
   * @param expiration 锁时长
   * @returns 
   */
  public async lock(key, value, expiration) {
    const result = await super.set(key, value, 'EX', expiration);
    return result === 'OK';
  }

  /**
   * 解锁操作
   * @param key 锁键
   * @param value 锁值
   * @returns 
   */
  public async unlock(key, value) {
    const currentValue = await super.get(key);
    if (currentValue === value) {
      await super.del(key);
      return true;
    } else {
      return false;
    }
  }

  /**
   * 使用加锁和解锁操作演示
   */
  private async useLock() {
    const key = 'myLock';
    const value = 'myValue';
    const expiration = 10; // 锁的过期时间，单位为秒

    const isLocked = await this.lock(key, value, expiration);
    if (isLocked) {
      console.log('Lock acquired successfully.');
      
      // 在这里执行需要加锁保护的操作

      const isUnlocked = await this.unlock(key, value);
      if (isUnlocked) {
        console.log('Lock released successfully.');
      } else {
        console.log('Failed to release lock.');
      }
    } else {
      console.log('Failed to acquire lock.');
    }
  }
  
}