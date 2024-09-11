import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  BaseEntity,
  CreateDateColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert
} from 'typeorm';
import { MediaWorker } from '../worker/media.worker.do';
import { MediaTransport } from '../transport/media.transport.do';
import { MediaRouter } from '../router/media.router.do';
import { Peer } from '../peer/peer.do';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class MediaRoom extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'id',
  })
  id: string;

  @BeforeInsert()
  updateId(): void {
    this.id = uuidv4()
  }

  // 新增接收自定义的 room_id
  @Column({
    type: 'varchar',
    name: 'room_id',
    nullable: false,
  })
  roomId!: string;

  // 关联的是 producer 服务的 routerId
  @Column({
    type: 'varchar',
    name: 'router_id'
  })
  routerId!: string;

  @Column({
    type: 'varchar',
    name: 'worker_id'
  })
  workerId!: string;
  // 存在 ManyToOne 时，获取当前对象，会包含该对象的数组
  @ManyToOne(() => MediaWorker, (worker) => worker.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'worker_id'
  })
  worker!: MediaWorker;

  @Column({
    type: 'text',
    nullable: true
  })
  metadata?: string;

  @CreateDateColumn({
    name: 'create_date'
  })
  createDate!: Date;
  
  @OneToMany(() => MediaRouter, (router) => router.room)
  routers!: MediaRouter[];

  @OneToMany(() => MediaTransport, (transport) => transport.room)
  transports!: MediaTransport[];

  // @OneToMany(() => Peer, (peer) => peer.room)
  // peers!: Peer[];
}
