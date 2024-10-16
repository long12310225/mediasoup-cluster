Http 部分：
| 是否迁移 |接口 | 方法 |描述|
|-- |-- |-- |--|
| ✅ |/rooms/:roomId |GET | 获取房间的 rtp 能力 |
|  | /rooms/:roomId/broadcasters | POST | 创建一个广播者 |
|  | /rooms/:roomId/broadcasters/:broadcasterId | DELETE | 删除广播者 |
|  | /rooms/:roomId/broadcasters/:broadcasterId/transports | POST | 创建与广播器关联的媒体组传输，可以用于 PlainTransport 或 WebrtcTransport 类型传输 |
|  | /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect | POST | 连接属于广播器的传输 |
|  | /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers | POST | 创建与广播器关联的生产者 |
|  | /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume | POST | 创建与广播器关联的消费者 |
|  | /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume/data | POST | 创建与广播器关联的数据生产者 |
|  | /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/produce/data | POST | 创建与广播器关联的数据消费者 |
|  | 自己添加的 HTTP 接口 | -- | -- |
|  | /rooms/:roomId/broadcasters/:broadcasterId/consume/:consumeId/resume | POST | 恢复消费 |
|  | /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/plainconnect | POST | 连接属于广播器的传输：特指 PlainTransport |
