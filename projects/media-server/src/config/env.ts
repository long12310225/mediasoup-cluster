import * as chalk from 'chalk';
import { load as yamlLoad } from 'js-yaml';
import { join } from 'path';
import { readFileSync } from 'fs';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ENVS } from './default';
import LocalEnv from './local-env';
import { getNacosConfig } from '../common/nacos';

class Env {
  private static TAG = 'Environment';
  private static emptyList = [null, undefined];
  private static envPath: string = process.env.NODE_ENV;
  
  // 缓存配置表
  localEnvConfig = {};

  constructor() {
    console.log(chalk.yellow(`${Env.TAG}: 开始载入${process.env.NODE_ENV}环境变量配置，准备验证...`));
    if (!ENVS.includes(Env.envPath)) {
      const msg = chalk.red(
        `${
          Env.TAG
        }: "NODE_ENV" 环境变量配置不正确，可选: ${ENVS.toString()}, 当前: ${
          Env.envPath
        }`,
      );
      throw new Error(msg);
    }

    // 获取 env.xxx.yaml 路径
    const envFilePath = join(
      __dirname,
      `../../env.${Env.envPath.toLocaleLowerCase()}.yaml`,
    );
    // 解析yaml文件
    this.localEnvConfig = Object.assign({}, this.localEnvConfig, yamlLoad(readFileSync(envFilePath, 'utf8')));
    // console.log("%c Line:39 🍋 1this.localEnvConfig", "color:#93c0a4", this.localEnvConfig);

    if (Env.emptyList.includes(this.localEnvConfig)) {
      const msg = chalk.red(`${Env.TAG}: 配置文件为空，路径: ${envFilePath}`);
      throw new Error(msg);
    }

    this.onValidateLocalEnvFile();
  }

  public addEnvConfig(config) {
    // console.log("%c Line:41 🥚 2config", "color:#3f7cff", config);
    if (config instanceof Object && Object.keys(config).length) { 
      this.localEnvConfig = Object.assign({}, this.localEnvConfig, config)
      console.log("%c Line:45 🍐 3this.localEnvConfig", "color:#7f2b82", this.localEnvConfig);
    }
  }

  /**
   * 验证本地载入的环境变量配置
   */
  private onValidateLocalEnvFile(): void {
    // 检查本地环境变量配置
    const localEnvObject = plainToClass(LocalEnv, this.localEnvConfig, {
      excludeExtraneousValues: true,
    });
    const errors = validateSync(localEnvObject);
    if (errors.length > 0) {
      console.log(chalk.red(`${Env.TAG}: 验证失败，请检查环境变量配置\n`));
      const errorsObj = chalk.red(JSON.stringify(this.buildError(errors)));
      console.log(errorsObj);
      const msg = chalk.red(`${Env.TAG}: 本地环境变量配置有误\n`);
      throw new Error(msg);
    } else {
      console.log(chalk.green(`${Env.TAG}: 验证成功，正在启动服务...\n`));
    }
  }

  /**
   * 构建错误提示
   * @param errors
   * @returns
   */
  private buildError(errors) {
    const result = {};
    errors.forEach((e) => {
      const prop = e.property;
      Object.entries(e.constraints).forEach((constraint) => {
        result[prop] = `${constraint[1]}`;
      });
    });
    return result;
  }

  /**
   * 获取环境变量
   * @param { string } key
   * @param { T extends EnvType } type
   * @returns
   */
  public getEnv(
    key: string
  ) {
    const val: any = this.localEnvConfig[key];
    const valType = typeof val;

    if (![null, undefined].includes(val)) {
      return val
    }
    console.log("%c Line:140 🍒", "color:#33a5ff", `没有此 ${key} 变量, 请检查配置文件`);
    return ''
  }
  
}

export default new Env();
