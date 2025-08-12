import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PayAccountingPayment } from './pay_accounting_payment.entity';
import { UserBankAccount } from './user_bank_account.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'email' })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: ['admin', 'accountant', 'customer'], name: 'role' })
  role!: 'admin' | 'accountant' | 'customer';

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

  @OneToMany(() => UserBankAccount, (ba) => ba.user)
  bankAccounts!: UserBankAccount[];

  @OneToMany(() => PayAccountingPayment, (p) => p.user)
  payments!: PayAccountingPayment[];
}
