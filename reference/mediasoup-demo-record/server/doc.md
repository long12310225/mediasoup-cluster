Http 部分：
|接口 | 方法 |描述|
|-- |-- |--|
|/rooms/:roomId |GET | 获取房间的 rtp 能力 |
| /rooms/:roomId/broadcasters | POST | 创建一个广播者 |
| /rooms/:roomId/broadcasters/:broadcasterId | DELETE | 删除广播者 |
| /rooms/:roomId/broadcasters/:broadcasterId/transports | POST | 创建与广播器关联的媒体组传输，可以用于 PlainTransport 或 WebrtcTransport 类型传输 |
| /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect | POST | 连接属于广播器的传输 |
| /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers | POST | 创建与广播器关联的生产者 |
| /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume | POST | 创建与广播器关联的消费者 |
| /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume/data | POST | 创建与广播器关联的数据生产者 |
| /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/produce/data | POST | 创建与广播器关联的数据消费者 |
| 自己添加的 HTTP 接口 | -- | -- |
| /rooms/:roomId/broadcasters/:broadcasterId/consume/:consumeId/resume | POST | 恢复消费 |
| /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/plainconnect | POST | 连接属于广播器的传输：特指 PlainTransport |


Websocket部分：
原有信令
1、getRouterRtpCapabilities    获取服务器路由的rtp能力
2、join    加入房间
3、createWebRtcTransport 创建webrtctransport类型通道
4、connectWebRtcTransport 连接通道
5、restartIce 重启ICE
6、produce/closeProducer 创建/关闭生产者
7、pauseProducer/resumeProducer 暂停/恢复生产者
8、pauseConsumer/resumeConsumer    暂停/恢复消费者
9、setConsumerPreferedLayers    设置消费层级
10、setConsumerPriority    设置消费优先级
11、requestConsumerKeyFrame    请求消费关键帧
12、produceData    生产数据（聊天）
13、changeDisplayName    改名
14、getTransportStats    获取传输状态
15、getProducerStats    获取生产者状态
16、getConsumerStats    获取消费者状态
17、getDataProducerStats    获取数据生产者状态
18、getDataConsumerStats    获取数据消费者状态
19、applyNetworkThrottle    限流
20、resetNetworkThrottle    重设限流

自己添加的信令
1、exitRoom主动退出房间
2、pauseConsumers/resumeConsumers批量操作