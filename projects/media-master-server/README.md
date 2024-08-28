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
 |-- common            用于存放全局性的其他拓展功能
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
 |-- shared            用于存放基于nest全局功能点的封装内容（如：过滤器、拦截器、管道、模块等）
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


## 表设计

```sql
CREATE TABLE media_worker (
  id UUID NOT NULL PRIMARY KEY,
  api_host TEXT NOT NULL,
  type TEXT NOT NULL,
  api_port INT NOT NULL CHECK (api_port > 0 AND api_port <= 999999999),
  pid INT NOT NULL CHECK (pid > 0 AND pid <= 999999999),
  max_transport INT NOT NULL CHECK (max_transport > 0 AND max_transport <= 999999999),
  transport_count INT NOT NULL CHECK (transport_count > 0 AND transport_count <= 999999999),
  error_count INT NOT NULL CHECK (error_count > 0 AND error_count <= 999999999),
  create_date TIMESTAMP(6) NOT NULL
);
```

```sql
CREATE TABLE media_room (
  id UUID NOT NULL PRIMARY KEY,
  room_id text NOT NULL,
  router_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  metadata JSONB,
  create_date TIMESTAMP(6) NOT NULL
);
```

```sql
CREATE TABLE media_router (
  id UUID NOT NULL PRIMARY KEY,
  room_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  piped_producers UUID,
  piped_dataproducers UUID,
  metadata JSONB,
  create_date TIMESTAMP(6) NOT NULL
);
```

```sql
CREATE TABLE media_transport (
  id UUID NOT NULL PRIMARY KEY,
  worker_id UUID NOT NULL,
  room_id UUID NOT NULL,
  router_id UUID NOT NULL,
  user_id text,
  type text NOT NULL,
  metadata JSONB,
  create_date TIMESTAMP(6) NOT NULL
);
```

```sql
CREATE TABLE media_producer (
  id UUID NOT NULL PRIMARY KEY,
  kind text NOT NULL,
  transport_id UUID NOT NULL,
  create_date TIMESTAMP(6) NOT NULL
);
```

```sql
CREATE TABLE media_consumer (
  id UUID NOT NULL PRIMARY KEY,
  producer_id UUID NOT NULL,
  transport_id UUID NOT NULL,
  create_date TIMESTAMP(6) NOT NULL
);
```

```sql
CREATE TABLE media_data_producer (
  id UUID NOT NULL PRIMARY KEY,
  label text NOT NULL,
  protocol text NOT NULL,
  transport_id UUID NOT NULL,
  create_date TIMESTAMP(6) NOT NULL
);
```

```sql
CREATE TABLE media_data_consumer (
  id UUID NOT NULL PRIMARY KEY,
  data_producer_id UUID NOT NULL,
  label text NOT NULL,
  protocol text NOT NULL,
  transport_id UUID NOT NULL,
  create_date TIMESTAMP(6) NOT NULL
);
```

## 分布式调用链

```
                              +-----------------------------------------------------+
                              |                                                     |
     + ---------------------> |  costom application logic or specialized frameworks |
     |                        |                                                     |
     |                        +-----------------------------------------------+-----+
     |                                                                        |   
     |                                                                        |   
     |       +-------------+  +----------+  +------------+                    |   
     |       |             |  |          |  |            |                    |   
     |       |   metrics   |  |   logs   |  |   traces   +----+               |   
     |       |             |  |          |  |            |                    |   
     |       +------+------+  +-----+----+  +------+-----+                    |   
     |              ^               ^              ^                          |   
     |       +------+---------------+--------------+-----+                    |   
     |       |                                           |                    |   
     +-----> +                  baggage                  |                    |   
     |       |                                           |                    |   
     |       +-------------------------------------------+                    |   
     |                                                                        |   
     |                                                                        |   
```


## 录制脚本使用注意事项

需要先安装： `ffmpeg httpie jq`

若正在录制了，退出录制使用： `ctrl + z`

查询本地正在执行的 ffmpeg 列表： `ps -ef | grep ffmpeg`

```bash
ouyang@ouyangdeiMac broadcasters % ps -ef | grep ffmpeg
  501  5937  5423   0 10:38上午 ttys003    0:00.01 sh ffmpeg_pull.sh
  501  5991  5937   0 10:40上午 ttys003    0:00.44 ffmpeg -thread_queue_size 10240 -protocol_whitelist file,udp,rtp -i v.sdp -vcodec copy -y ./output.webm
  501  6956  5423   0 10:52上午 ttys003    0:00.00 grep ffmpeg
```
删除进程：
`kill -9 5991`


## 相关文档

[ioredis文档](https://redis.github.io/ioredis/classes/Redis.html)
[ioredis源码](https://github.com/redis/ioredis)
