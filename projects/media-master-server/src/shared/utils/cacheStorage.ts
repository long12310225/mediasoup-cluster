// import * as chalk from 'chalk'

interface StateOptions {
  authorization: unknown;
}

interface StorageConfig {
  state: Partial<StateOptions>;
}

/**
 * 变量存储类
 */
class CacheStorage implements StorageConfig {
  state = {
    authorization: null,
  };

  getItem<T>(key = 'authorization'): T {
    // console.log(chalk.blueBright('====CacheStorage getItem ===='), key)
    // console.log(this.state)
    return this.state[key];
  }

  setItem(key = 'authorization', authorization: unknown) {
    // console.log(chalk.blueBright('====CacheStorage getItem ===='), key)
    this.state[key] = authorization;
  }

  removeItem(key: string) {
    if (this.state[key]) {
      this.state[key] = null;
    }
  }

  clear() {
    Object.keys(this.state).forEach((key) => {
      this.removeItem(key);
    });
  }
}

export default new CacheStorage();
