import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { PayoutAudit } from './payout_audit.entity';

@Entity({ name: 'pay_accounting_payment' })
export class PayAccountingPayment {
  // payment_id BIGINT NOT NULL PRIMARY KEY (no auto-increment)
  @PrimaryColumn({ type: 'bigint', name: 'payment_id' })
  paymentId!: string;

  // user_id INT NULL
  @Column({ type: 'int', name: 'user_id', nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, (u) => u.payments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  // amount DECIMAL(12,2) NULL
  @Column({ type: 'decimal', name: 'amount', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  // paid DATETIME(6) NULL
  @Column({ type: 'datetime', name: 'paid', precision: 6, nullable: true })
  paid!: Date | null;

  // paid_method VARCHAR(50) NULL
  @Column({ type: 'varchar', name: 'paid_method', length: 50, nullable: true })
  paidMethod!: string | null;

  // paid_tracking_id VARCHAR(128) NULL
  @Column({ type: 'varchar', name: 'paid_tracking_id', length: 128, nullable: true })
  paidTrackingId!: string | null;

  // paid_sent_to TEXT NULL
  @Column({ type: 'text', name: 'paid_sent_to', nullable: true })
  paidSentTo!: string | null;

  // paid_notes TEXT NULL
  @Column({ type: 'text', name: 'paid_notes', nullable: true })
  paidNotes!: string | null;

  // technician_w9_id BIGINT NULL
  @Column({ type: 'bigint', name: 'technician_w9_id', nullable: true })
  technicianW9Id!: string | null;

  @UpdateDateColumn({
    type: 'datetime',
    name: 'updated_at',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date;

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date;

  @OneToMany(() => PayoutAudit, (a) => a.payment)
  audits!: PayoutAudit[];
}
