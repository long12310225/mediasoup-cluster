# 项目介绍

## 安装

```
npm install
or
yarn
```

## 运行

```
npm start
```

## 项目目录

```bash
src
 |-- common            用于存放基于nest全局功能点的封装内容（如：过滤器、拦截器、管道等等）
 |-- config            用于存放全局的配置信息
 |-- controllers       用于存放controller，与modules一一对应
 |   |-- xxx
 |   |-- yyy
 |-- dao               用于存放dao，与modules一一对应
 |   |-- xxx
 |   |-- yyy
 |-- dto               用于存放dto，与modules一一对应
 |   |-- xxx
 |   |-- yyy
 |-- modules           用于存放module
 |   |-- xxx
 |   |-- yyy
 |-- services          用于存放service，与modules一一对应
 |   |-- xxx
 |   |-- yyy
 |-- shared            用于存放全局性的其他拓展功能
 |-- app.module.ts     主模块
 |-- main.ts           入口
```

## 设计概念

采用传统java后端层级设计，将层级单独存放。

### 层级说明

- modules：模块层
- controller：控制层
- service：服务层
- dto：数据传输对象层
- dao：实体层

## 本工程提供了什么功能？

- 环境验证
- 添加了跨域白名单配置
- 添加了 http 头安全漏洞设置（可配置跨域、安全策略等）【helmet】
- http 异常过滤器
- 添加验证管道（验证只接收有定义 dto 对象的数据）
- 项目本地运行控制台输出提示（可忽略）
- 添加了 api 文档（swagger）

- 添加了 log 拦截器（当接口被访问时，输出到控制台）

- 架构设计中，添加 dto 层
- 架构设计中，添加 dao 层

- 添加了数据库连接

- 添加 axios，单独抽象
- 封装统一返回的数据结构，全局注册过滤器（异常返回）
- 封装统一返回的数据结构，全局注册拦截器（拦截数据处理成统一规格）

- 添加 base module 模块，用于存放一些公共接口
