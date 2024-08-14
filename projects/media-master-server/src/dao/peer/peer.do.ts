import {
  Entity,
  BaseEntity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { MediaRouter } from '../router/media.router.do';
import { MediaRoom } from '../room/media.room.do';

@Entity()
export class Peer extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'id',
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'router_id',
  })
  routerId!: string;
  @ManyToOne(() => MediaRouter, (mediaRouter) => mediaRouter.peers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'router_id',
  })
  router!: MediaRouter;

  // @Column({
  //   type: 'varchar',
  //   length: 36,
  //   name: 'room_id'
  // })
  // roomId!: string;
  // @ManyToOne(() => MediaRoom, (room) => room.peers, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({
  //   name: 'room_id'
  // })
  // room!: MediaRoom;

  @CreateDateColumn({
    name: 'create_date',
  })
  createDate!: Date;
}
