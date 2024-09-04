import {
  Entity,
  BaseEntity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  OneToMany,
  CreateDateColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
// import { MediaWorker } from '@/dao/worker/media.worker.do';

@Entity()
export class Serve extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'id',
  })
  id: string;

  @BeforeInsert()
  updateId(): void {
    this.id = uuidv4();
  }

  @Column({
    type: 'varchar',
  })
  host: string;

  @Column({
    type: 'int',
  })
  port: number;

  @Column({
    name: 'is_alive_serve',
    type: 'int',
    default: 0,
  })
  isAliveServe?: number;

  @CreateDateColumn({
    name: 'create_date',
  })
  createTime?: Date;

  // @OneToMany(() => MediaWorker, (worker) => worker.serve)
  // workers!: MediaWorker[];
}
