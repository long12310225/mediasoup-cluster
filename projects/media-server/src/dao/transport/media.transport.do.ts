import {
  Entity,
  BaseEntity,
  CreateDateColumn,
  Column,
  PrimaryColumn,
  ManyToOne,
  Index,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { MediaWorker } from '../worker/media.worker.do';
import { MediaRoom } from '../room/media.room.do';
import { MediaConsumer } from '../consumer/media.consumer.do';
import { MediaProducer } from '../producer/media.producer.do';

@Entity({
  comment: 'transport表'
})
export class MediaTransport extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'id',
  })
  id: string;

  @Column({
    type: 'varchar',
    name: 'worker_id',
    comment: 'worker id'
  })
  workerId!: string;
  @ManyToOne(() => MediaWorker, (worker) => worker.transports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'worker_id'
  })
  worker!: MediaWorker;

  @Column({
    type: 'varchar',
    name: 'room_id',
    comment: 'room id'
  })
  roomId!: string;
  @ManyToOne(() => MediaRoom, (room) => room.transports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'room_id'
  })
  room!: MediaRoom;

  @Column({
    type: 'varchar',
    name: 'router_id',
    comment: 'router id'
  })
  routerId!: string;

  @Index()
  @Column({
    type: 'varchar',
    name: 'user_id',
    nullable: true,
    comment: 'user id'
  })
  userId?: string;

  @OneToMany(() => MediaConsumer, (consumer) => consumer.transport)
  consumers!: MediaConsumer[];

  @OneToMany(() => MediaProducer, (producer) => producer.transport)
  producers!: MediaProducer[];

  @Column({
    type: 'text',
    comment: '服务类型'
  })
  type!: string; // consumer | producer

  @Column({
    type: 'json',
    nullable: true,
    comment: 'metadata'
  })
  metadata?: any;

  @CreateDateColumn({
    name: 'create_date',
    comment: '创建时间'
  })
  createDate!: Date;
}
