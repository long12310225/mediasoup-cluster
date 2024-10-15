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
  comment: 'dataProducer表'
})
export class MediaDataProducer extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'id',
  })
  id: string;

  @Column({
    type: 'varchar',
    comment: 'label'
  })
  label: string

  @Column({
    type: 'varchar',
    comment: 'protocol'
  })
  protocol: string

  @Column({
    type: 'varchar',
    name: 'transport_id',
    comment: 'transport id'
  })
  transportId: string;
  @ManyToOne(() => MediaTransport, (transport) => transport.producers, {
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
