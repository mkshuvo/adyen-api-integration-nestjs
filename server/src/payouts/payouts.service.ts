import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { PayoutAudit } from '../entities/payout_audit.entity';
import { User } from '../entities/user.entity';
import { UserBankAccount } from '../entities/user_bank_account.entity';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(PayAccountingPayment) private readonly paymentsRepo: Repository<PayAccountingPayment>,
    @InjectRepository(PayoutAudit) private readonly auditRepo: Repository<PayoutAudit>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserBankAccount) private readonly bankRepo: Repository<UserBankAccount>,
  ) {}

  async submit(paymentId: string) {
    const payment = await this.paymentsRepo.findOne({ where: { paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.paid) throw new BadRequestException('Payment already marked as paid');
    if (!payment.userId) throw new BadRequestException('Payment not linked to a user');

    const user = await this.usersRepo.findOne({ where: { id: payment.userId } });
    if (!user) throw new NotFoundException('User not found');

    const bank = await this.bankRepo.findOne({ where: { userId: user.id } });
    if (!bank) throw new BadRequestException('User has no bank account');
    if (bank.status !== 'valid') throw new BadRequestException('Bank account is not validated');

    // Idempotency: if an 'initiated' audit exists, return existing state
    const existing = await this.auditRepo.findOne({ where: { paymentId: payment.paymentId, status: 'initiated' } });
    if (existing) {
      return { status: 'already_initiated', audit_id: existing.id } as const;
    }

    const audit = this.auditRepo.create({
      paymentId: payment.paymentId,
      status: 'initiated',
      message: 'Payout submitted (simulated)'
    });
    await this.auditRepo.save(audit);

    // In a full implementation, enqueue a job to call Adyen and update audit with PSP reference
    return { status: 'initiated', audit_id: audit.id } as const;
  }
}
