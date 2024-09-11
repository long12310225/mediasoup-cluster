import {Logger} from './Logger';

const logger = new Logger('Bot');

export class Bot {
    private _transport: any; // 假设mediasoup的类型定义未给出，这里使用any，实际应替换为具体类型
    private _dataProducer: any; // 同上，应替换为具体类型

    static async create({ mediasoupRouter }: { mediasoupRouter: any }): Promise<Bot> { // 类型需根据实际情况调整
        const transport = await mediasoupRouter.createDirectTransport({
            maxMessageSize: 512
        });

        const dataProducer = await transport.produceData({ label: 'bot' });

        return new Bot({ transport, dataProducer });
    }

    constructor({ transport, dataProducer }: { transport: any; dataProducer: any }) { // 类型需根据实际情况调整
        this._transport = transport;
        this._dataProducer = dataProducer;
    }

    get dataProducer(): any { // 类型需根据实际情况调整
        return this._dataProducer;
    }

    close(): void {
        // No need to do anything.
    }

    async handlePeerDataProducer({ dataProducerId, peer }: { dataProducerId: string; peer: any }): Promise<void> { // 类型需根据实际情况调整
        const dataConsumer = await this._transport.consumeData({
            dataProducerId
        });

        dataConsumer.on('message', (message, ppid) => {
            if (ppid !== 51) {
                logger.warn('ignoring non string message from a Peer');
                return;
            }

            const text = message.toString('utf8');

            logger.debug(
                'SCTP message received [peerId:%s, size:%d]', peer.id, message.byteLength
            );

            const messageBack = `${peer.data.displayName} said me: "${text}"`;
            this._dataProducer.send(messageBack);
        });
    }
}