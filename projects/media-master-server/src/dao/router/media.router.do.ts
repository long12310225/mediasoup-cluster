import {
  Entity,
  BaseEntity,
  CreateDateColumn,
  Column,
  ManyToOne,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { MediaWorker } from '../worker/media.worker.do';
import { MediaRoom } from '../room/media.room.do';

@Entity()
@Index(['workerId', 'roomId'], { unique: true })
export class MediaRouter extends BaseEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  workerId!: string;

  @ManyToOne(() => MediaWorker, (worker) => worker.routers, {
    onDelete: 'CASCADE',
  })
  worker!: MediaWorker;

  @Column('uuid')
  roomId!: string;

  @ManyToOne(() => MediaRoom, (room) => room.routers, { onDelete: 'CASCADE' })
  room!: MediaRoom;

  @Column('uuid', { array: true, nullable: true, default: [] })
  pipedProducers!: Array<string>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  createDate!: Date;
}
