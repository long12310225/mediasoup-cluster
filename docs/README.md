# Mediasoup集群

### 集群架构
```
                                                           +----------------+
        +-----------------+          webrtc                |  slave server  |
        | producer client |------------------------------->|  for producer  |
        +-----------------+                                +----------------+
                  |                                             ^      |
                  |                +---------------+            |      |
                  +--------------->|               |------------+      | mediasoup
                       http        | master server |   http            |   pipe
                  +--------------->|               |------------+      | transport
                  |                +---------------+            |      |
                  |                                             v      v
                  |                                        +----------------+
        +-----------------+                                |  slave server  |
        | consumer client |<-------------------------------|  for consumer  |
        +-----------------+         webrtc                 +----------------+
```

### 编译运行服务端

- 编译
  ```
  npm install
  npm run build
  ```

- 运行信令服务
  ```
  npm run start:master
  ```

- 运行生产者服务
  ```
  npm run start:slave:producer
  ```

- 运行消费者服务
  ```
  npm run start:slave:consumer
  ```

  
### 编译运行客户端
- 配置文件
  ```
  复制一份 .env.dev为 .env
  修改.env 文件中LISTEN_HOST和ip，改为本机ip
  ```

- 编译测试客户端
  ```
  cd examples/rooms/
  npm install
  npm run dev

  浏览器打开 https://ip:4430/
  
  ```


### 服务端文件夹结构
- apis
  ```
  主从服务的HTTP路由配置
  ```

- entities
  ```
  服务的实体类，使用typeorm进行数据库的映射
  ```

- services
  ```
  信令服务的业务逻辑
  ```

- services/mediasoup
  ```
  mediasoup的封装
  ```

- utils
  ```
  工具类，用于启动服务，数据源连接等
  ```


### 服务端流程
 - [客户端](./流程图/客户端流程/启动/启动.md)
 - [主信令服务](./流程图/主信令服务流程/启动/启动.md)
 - [从生产服务](./流程图/从生产服务流程/启动/启动.md)
 - [从消费服务](./流程图/从消费服务流程/启动/启动.md)
