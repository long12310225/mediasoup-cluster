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

@Entity()
export class MediaDataProducer extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'id',
  })
  id: string;

  @Column('varchar')
  label: string

  @Column('varchar')
  protocol: string

  @Column({
    type: 'varchar',
    name: 'transport_id'
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
    name: 'create_date'
  })
  createDate!: Date;
}
