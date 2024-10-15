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
import { v4 as uuidv4 } from 'uuid';

@Entity({
  comment: 'worker表'
})
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
    name: 'api_host',
    comment: '服务host'
  })
  apiHost!: string;

  @Column({
    type: 'int',
    name: 'api_port',
    comment: '服务port'
  })
  apiPort!: number;

  @Column({
    type: 'varchar',
    comment: '服务类型'
  })
  type!: string; // consumer | producer

  @Column({
    type: 'int',
    comment: 'pid'
  })
  pid!: number;

  @Column({
    type: 'int',
    name: 'max_transport',
    default: 1e9,
    comment: 'transport上限'
  })
  maxTransport!: number;

  @Column({
    type: 'int',
    name: 'transport_count',
    default: 0,
    comment: 'transport当前数量'
  })
  transportCount!: number;

  @Column({
    type: 'int',
    name: 'error_count',
    default: 0,
    comment: '异常数量'
  })
  errorCount!: number;

  @Column({
    name: 'is_alive_serve',
    type: 'int',
    default: 0,
    comment: '服务是否存活'
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
    name: 'create_date',
    comment: '创建时间'
  })
  createDate!: Date;
}
