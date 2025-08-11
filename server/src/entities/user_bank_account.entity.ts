import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_bank_account' })
export class UserBankAccount {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id!: string;

  @Column({ type: 'int', name: 'user_id' })
  @Index('idx_user_bank_account_user_id')
  userId!: number;

  @ManyToOne(() => User, (u) => u.bankAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 2, name: 'country' })
  country!: string;

  @Column({ type: 'varchar', length: 3, name: 'currency' })
  currency!: string;

  @Column({ type: 'varchar', length: 255, name: 'account_holder_name' })
  accountHolderName!: string;

  @Column({ type: 'varchar', length: 34, name: 'iban', nullable: true })
  iban!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'account_number', nullable: true })
  accountNumber!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'routing_code', nullable: true })
  routingCode!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'adyen_recurring_detail_reference', nullable: true })
  adyenRecurringDetailReference!: string | null;

  @Column({ type: 'enum', enum: ['unvalidated', 'valid', 'invalid'], name: 'status', default: 'unvalidated' })
  status!: 'unvalidated' | 'valid' | 'invalid';

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime',
    name: 'updated_at',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date;
}
