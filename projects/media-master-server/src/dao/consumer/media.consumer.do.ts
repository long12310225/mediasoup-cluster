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
    name: 'producer_id'
  })
  producerId: string;

  @Column({
    type: 'varchar',
    name: 'transport_id'
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
    name: 'create_date'
  })
  createDate!: Date;
}
