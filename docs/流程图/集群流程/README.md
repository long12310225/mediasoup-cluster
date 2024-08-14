#### 集群流程说明
  主要是以Record的信令与HTTP接口为主，结合Cluster的流程，梳理Nest集群的流程。

  Record的信令
  1、getRouterRtpCapabilities
  2、join
  3、createWebRtcTransport
  4、connectWebRtcTransport
  5、restartIce
  6、produce/closeProducer
  7、pauseProducer/resumeProducer
  8、pauseConsumer/resumeConsumer
  9、setConsumerPreferedLayers
  10、setConsumerPriority
  11、requestConsumerKeyFrame
  12、produceData
  13、changeDisplayName
  14、getTransportStats
  15、getProducerStats
  16、getConsumerStats
  17、getDataProducerStats
  18、getDataConsumerStats
  19、applyNetworkThrottle
  20、resetNetworkThrottle

  自己添加的信令
  1、exitRoom主动退出房间
  2、pauseConsumers/resumeConsumers

  Record的HTTP接口
  /rooms/:roomId
  /rooms/:roomId/broadcasters
  /rooms/:roomId/broadcasters/:broadcasterId
  /rooms/:roomId/broadcasters/:broadcasterId/transports
  /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect
  /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers
  /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume
  /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume/data
  /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/produce/data
  /rooms/:roomId/broadcasters/:broadcasterId/consume/:consumeId/resume
  /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/plainconnect

对会议来说主要核心流程其实就三个

- [加入会议](./加入会议.md)
- [推流](./推流.md)
- [拉流](./拉流.md)