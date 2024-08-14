```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Master as 主信令服务
    participant Producer as 从生产服务
    Client->>Master: 发送resumeProducer请求
    Master->>Master: 根据producerId找到所属Producer服务
    Master->>Producer: 转发resumeProducer请求
    Producer->>Producer: 根据producerId获取producer
    Producer->>Producer: producer调用resume恢复
    Producer->>Master: 返回resumeProducer响应
    Master->>Client: 返回resumeProducer响应
```
