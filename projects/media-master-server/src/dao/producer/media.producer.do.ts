import {
  Entity,
  BaseEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { MediaTransport } from '../transport/media.transport.do';

@Entity()
export class MediaProducer extends BaseEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  kind!: string;

  @Column('uuid')
  transportId!: string;

  @ManyToOne(() => MediaTransport, (transport) => transport.producers, {
    onDelete: 'CASCADE',
  })
  transport!: MediaTransport;

  @CreateDateColumn()
  createDate!: Date;
}
