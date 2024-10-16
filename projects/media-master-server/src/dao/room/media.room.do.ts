import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { MediaWorker } from '../worker/media.worker.do';
import { MediaTransport } from '../transport/media.transport.do';
import { MediaRouter } from '../router/media.router.do';

@Entity()
export class MediaRoom extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'room_id',
    type: 'text',
    nullable: false,
  })
  roomId!: string;

  @Column('uuid')
  workerId!: string;

  @ManyToOne(() => MediaWorker, (worker) => worker.rooms, {
    onDelete: 'CASCADE',
  })
  worker!: MediaWorker;

  // router to produce
  @Column('uuid')
  routerId!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  createDate!: Date;

  @OneToMany(() => MediaTransport, (transport) => transport.room)
  transports!: MediaTransport[];

  @OneToMany(() => MediaRouter, (router) => router.room)
  routers!: MediaRouter[];
}
