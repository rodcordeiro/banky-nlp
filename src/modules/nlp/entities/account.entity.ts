import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { PaymentsEntity } from './payments.entity';
import { UsersEntity } from './users.entity';

@Entity('bk_tb_accounts')
export class AccountsEntity extends BaseEntity {
  /** Columns */

  @Column()
  name: string;

  @Column({
    type: 'double',
  })
  ammount: number;

  @Column({
    type: 'double',
  })
  threshold: number;

  /** Joins */
  @ManyToOne(() => PaymentsEntity, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({
    name: 'paymentType',
    referencedColumnName: 'id',
  })
  paymentType: string;

  @ManyToOne(() => UsersEntity, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({
    name: 'owner',
    referencedColumnName: 'id',
  })
  owner: string;

  /** Methods */
}
