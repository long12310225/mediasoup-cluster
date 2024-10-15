import {
  Entity,
  BaseEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { MediaTransport } from '../transport/media.transport.do';

@Entity({
  comment: 'consumer表'
})
export class MediaConsumer extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'id',
  })
  id: string;

  @Column({
    type: 'varchar',
    name: 'producer_id',
    comment: 'producer id'
  })
  producerId: string;

  @Column({
    type: 'varchar',
    comment: '服务类型'
  })
  type!: string; // consumer | producer
 
  @Column({
    type: 'varchar',
    name: 'transport_id',
    comment: 'transport id'
  })
  transportId: string;
  @ManyToOne(() => MediaTransport, (transport) => transport.consumers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'transport_id'
  })
  transport: MediaTransport;

  @CreateDateColumn({
    name: 'create_date',
    comment: '创建时间'
  })
  createDate!: Date;
}
