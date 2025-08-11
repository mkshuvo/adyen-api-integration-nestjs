import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PayAccountingPayment } from './pay_accounting_payment.entity';

@Entity({ name: 'payout_audit' })
export class PayoutAudit {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id!: string;

  @Column({ type: 'bigint', name: 'payment_id' })
  paymentId!: string;

  @ManyToOne(() => PayAccountingPayment, (p) => p.audits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: PayAccountingPayment;

  @Column({ type: 'varchar', length: 64, name: 'status' })
  status!: string;

  @Column({ type: 'text', name: 'message', nullable: true })
  message!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'adyen_psp_reference', nullable: true })
  adyenPspReference!: string | null;

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date;
}
