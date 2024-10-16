import {
  Entity,
  Column,
  BaseEntity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MediaRoom } from '../room/media.room.do';
import { MediaTransport } from '../transport/media.transport.do';
import { MediaRouter } from '../router/media.router.do';

@Entity()
@Index(['apiHost', 'apiPort', 'pid'], { unique: true })
export class MediaWorker extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  apiHost!: string;

  @Column('text')
  for!: string; // consumer | producer

  @Column('integer')
  apiPort!: number;

  @Column('integer')
  pid!: number;

  @Column('integer', { default: 1e9 })
  maxTransport!: number;

  @Column('integer', { default: 0 })
  transportCount!: number;

  @Column('integer', { default: 0 })
  errorCount!: number;

  @OneToMany(() => MediaRoom, (room) => room.worker)
  rooms!: MediaRoom[];

  @OneToMany(() => MediaTransport, (transport) => transport.worker)
  transports!: MediaTransport[];

  @OneToMany(() => MediaRouter, (router) => router.worker)
  routers!: MediaRouter[];
}
