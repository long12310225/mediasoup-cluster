import {
  Entity,
  Column,
  BaseEntity,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
  BeforeInsert
} from 'typeorm';
import { MediaRoom } from '../room/media.room.do';
import { MediaTransport } from '../transport/media.transport.do';
import { MediaRouter } from '../router/media.router.do';
// import { Serve } from '@/dao/serve/serve.do';
import { v4 as uuidv4 } from 'uuid';

@Entity()
@Index(['apiHost', 'apiPort', 'pid'], { unique: true })
export class MediaWorker extends BaseEntity {
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

  @Column({
    type: 'varchar',
    name: 'api_host'
  })
  apiHost!: string;

  @Column('varchar')
  type!: string; // consumer | producer

  @Column({
    type: 'int',
    name: 'api_port'
  })
  apiPort!: number;

  @Column('int')
  pid!: number;

  @Column({
    type: 'int',
    name: 'max_transport',
    default: 1e9
  })
  maxTransport!: number;

  @Column({
    type: 'int',
    name: 'transport_count',
    default: 0
  })
  transportCount!: number;

  @Column({
    type: 'int',
    name: 'error_count',
    default: 0
  })
  errorCount!: number;

  @Column({
    name: 'is_alive_serve',
    type: 'int',
    default: 0,
  })
  isAliveServe?: number;

  @OneToMany(() => MediaRoom, (room) => room.worker)
  rooms!: MediaRoom[];

  @OneToMany(() => MediaTransport, (transport) => transport.worker)
  transports!: MediaTransport[];

  @OneToMany(() => MediaRouter, (router) => router.worker)
  routers!: MediaRouter[];

  // @Column({
  //   type: 'varchar',
  //   name: 'serve_id'
  // })
  // serveId!: string;

  // @JoinColumn({
  //   name: 'serve_id'
  // })
  // @ManyToOne(() => Serve, (serve) => serve.workers)
  // serve!: Serve;

  @CreateDateColumn({
    name: 'create_date'
  })
  createDate!: Date;
}
