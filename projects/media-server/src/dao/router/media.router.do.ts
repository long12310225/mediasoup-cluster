import {
  Entity,
  BaseEntity,
  CreateDateColumn,
  Column,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { MediaWorker } from '../worker/media.worker.do';
import { MediaRoom } from '../room/media.room.do';
import { Peer } from '../peer/peer.do'

@Entity({
  comment: 'router表'
})
@Index([
  'workerId',
  'roomId'
  // 'peerId'
], { unique: true })
export class MediaRouter extends BaseEntity {
  // 关联 consumer 服务的 routerId
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'id',
  })
  id: string;
  
  @OneToMany(() => Peer, (peer) => peer.router)
  peers!: Peer[];

  // 关联的是 MediaRoom 的主键 id
  @Column({
    type: 'varchar',
    name: 'room_id',
    comment: 'room id'
  })
  roomId!: string;
  // 多对一关联 MediaRoom
  @ManyToOne(() => MediaRoom, (room) => room.routers, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({
    name: 'room_id'
  })
  room!: MediaRoom;

  @Column({
    type: 'varchar',
    name: 'worker_id',
    comment: 'worker id'
  })
  workerId!: string;
  @ManyToOne(() => MediaWorker, (worker) => worker.routers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'worker_id'
  })
  worker!: MediaWorker;

  @Column({
    name: 'piped_producers',
    type: 'varchar',
    length: 6666,
    nullable: false,
    default: '',
    comment: '关联的pipeProducer'
  })
  pipedProducers!: string;

  @Column({
    name: 'piped_dataproducers',
    type: 'varchar',
    length: 6666,
    nullable: false,
    default: '',
    comment: '关联的pipeDataProducer'
  })
  pipedDataProducers!: string;

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
