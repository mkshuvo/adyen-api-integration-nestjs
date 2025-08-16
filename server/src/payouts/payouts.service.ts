import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { PayoutAudit } from '../entities/payout_audit.entity';
import { User } from '../entities/user.entity';
import { UserBankAccount } from '../entities/user_bank_account.entity';
import { BalanceService } from './balance.service';
import { AdyenService } from './adyen.service';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(PayAccountingPayment) private readonly paymentsRepo: Repository<PayAccountingPayment>,
    @InjectRepository(PayoutAudit) private readonly auditRepo: Repository<PayoutAudit>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserBankAccount) private readonly bankRepo: Repository<UserBankAccount>,
    private readonly balanceService: BalanceService,
    private readonly adyenService: AdyenService,
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

    // Budget/Balance check (major units, e.g. 250.00)
    const amt = payment.amount ? Number(payment.amount) : 0;
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new BadRequestException('Invalid or missing payment amount');
    }
    const available = this.balanceService.getAvailableMajorUnits();
    if (amt > available) {
      throw new BadRequestException(
        `Insufficient available payout budget. Needed ${amt.toFixed(2)}, available ${Number.isFinite(available) ? available.toFixed(2) : 'unlimited'}`,
      );
    }

    // Idempotency: if an 'initiated' audit exists, return existing state
    const existing = await this.auditRepo.findOne({ where: { paymentId: payment.paymentId, status: 'initiated' } });
    if (existing) {
      return { status: 'already_initiated', audit_id: existing.id } as const;
    }

    const audit = this.auditRepo.create({
      paymentId: payment.paymentId,
      status: 'initiated',
      message: 'Payout submission started',
    });
    await this.auditRepo.save(audit);

    // Call Adyen and record result
    const result = await this.adyenService.submitPayout(payment, user, bank);

    // On successful submission, persist destination and tracking details immediately
    if (result.status === 'submitted') {
      payment.paidMethod = 'bank';
      payment.paidTrackingId = result.pspReference ?? null;
      payment.paidSentTo = this.serializeBankDestination(bank);
      await this.paymentsRepo.save(payment);
    }

    const followUp = this.auditRepo.create({
      paymentId: payment.paymentId,
      status: result.status === 'submitted' ? 'submitted' : 'failed',
      message: result.message ?? null,
      adyenPspReference: result.pspReference ?? null,
    });
    await this.auditRepo.save(followUp);

    return { status: 'initiated', audit_id: audit.id, submission_audit_id: followUp.id } as const;
  }

  async getPayoutDetails(paymentId: string) {
    const payment = await this.paymentsRepo.findOne({ where: { paymentId }, relations: ['audits'] });
    if (!payment) throw new NotFoundException('Payment not found');

    // Prepare a safe response object
    const audits = (payment.audits || []).map((a) => ({
      id: a.id,
      status: a.status,
      message: a.message,
      adyen_psp_reference: a.adyenPspReference,
      created_at: a.createdAt,
    }));

    return {
      payment_id: payment.paymentId,
      user_id: payment.userId,
      amount: payment.amount,
      paid: payment.paid,
      paid_method: payment.paidMethod,
      paid_tracking_id: payment.paidTrackingId,
      paid_sent_to: payment.paidSentTo,
      paid_notes: payment.paidNotes,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
      audits,
    } as const;
  }

  private serializeBankDestination(bank: UserBankAccount): string {
    const last4 = (val?: string | null) => (val ? val.slice(-4) : undefined);
    const payload: Record<string, unknown> = {
      country: bank.country,
      currency: bank.currency,
      account_holder_name: bank.accountHolderName,
      iban_last4: last4(bank.iban),
      account_number_last4: last4(bank.accountNumber),
      routing_code_last4: last4(bank.routingCode),
    };
    return JSON.stringify(payload);
  }
}
