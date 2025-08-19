import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { User } from '../entities/user.entity';
import { UserBankAccount } from '../entities/user_bank_account.entity';
import { AdyenPayoutService } from '../adyen/adyen-payout.service';

export interface CreatePaymentDto {
  userId: number;
  amount: number;
  description?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PayAccountingPayment) 
    private readonly paymentsRepo: Repository<PayAccountingPayment>,
    @InjectRepository(User) 
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserBankAccount)
    private readonly bankAccountsRepo: Repository<UserBankAccount>,
    private readonly adyenPayoutService: AdyenPayoutService,
  ) {}

  async createPayment(dto: CreatePaymentDto): Promise<PayAccountingPayment> {
    const user = await this.usersRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    // Generate a unique payment ID
    const paymentId = Date.now().toString();

    const payment = this.paymentsRepo.create({
      paymentId,
      userId: dto.userId,
      amount: dto.amount.toString(),
      paid: null, // Not paid yet
      paidMethod: null,
      paidTrackingId: null,
      paidSentTo: null,
      paidNotes: dto.description || `Payment for ${user.email}`,
      technicianW9Id: null,
    });

    return this.paymentsRepo.save(payment);
  }

  async getUserPayments(userId: number): Promise<PayAccountingPayment[]> {
    return this.paymentsRepo.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getPendingPayments(): Promise<PayAccountingPayment[]> {
    return this.paymentsRepo.find({
      where: { paid: null as any },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async markAsPaid(paymentId: string, trackingId?: string): Promise<PayAccountingPayment> {
    const payment = await this.paymentsRepo.findOne({ where: { paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    payment.paid = new Date();
    payment.paidMethod = 'adyen_payout';
    if (trackingId) payment.paidTrackingId = trackingId;

    return this.paymentsRepo.save(payment);
  }

  /**
   * Process payout to customer's bank account using Adyen
   */
  async processAdyenPayout(paymentId: string): Promise<{ success: boolean; pspReference?: string; error?: string }> {
    try {
      const payment = await this.paymentsRepo.findOne({ 
        where: { paymentId },
        relations: ['user']
      });
      if (!payment) throw new NotFoundException('Payment not found');

      // Get customer's bank account
      const bankAccount = await this.bankAccountsRepo.findOne({
        where: { userId: payment.userId! }
      });
      if (!bankAccount) {
        throw new NotFoundException('No bank account found for customer');
      }

      // Prepare bank details for Adyen
      const bankDetails = {
        ownerName: bankAccount.accountHolderName,
        countryCode: bankAccount.country,
        ...(bankAccount.iban && { iban: bankAccount.iban }),
        ...(bankAccount.accountNumber && { accountNumber: bankAccount.accountNumber }),
        ...(bankAccount.routingCode && { routingNumber: bankAccount.routingCode }),
      };

      // Create payout via Adyen
      const payoutResult = await this.adyenPayoutService.createBankPayout({
        amount: parseFloat(payment.amount || '0'),
        currency: bankAccount.currency,
        reference: payment.paymentId,
        bankDetails,
      });

      if (payoutResult.resultCode === 'Authorised') {
        // Mark payment as paid
        payment.paid = new Date();
        payment.paidMethod = 'adyen_payout';
        payment.paidTrackingId = payoutResult.pspReference ?? null;
        payment.paidSentTo = JSON.stringify(bankDetails);
        await this.paymentsRepo.save(payment);

        return { success: true, pspReference: payoutResult.pspReference };
      } else {
        return { 
          success: false, 
          error: payoutResult.refusalReason || 'Payout was not authorized' 
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserStats(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const payments = await this.paymentsRepo.find({ where: { userId } });
    const unpaidAmount = payments
      .filter(p => !p.paid)
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

    return {
      totalPayments: payments.length,
      unpaidAmount,
      paidAmount: payments
        .filter(p => p.paid)
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
    };
  }

  async getDashboardStats() {
    const allPayments = await this.paymentsRepo.find();
    
    const totalPayouts = allPayments.length;
    const pendingPayouts = allPayments.filter(p => !p.paid).length;
    const successfulPayouts = allPayments.filter(p => p.paid).length;
    const failedPayouts = 0; // No failed status in current schema
    const totalAmount = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

    return {
      totalPayouts,
      pendingPayouts,
      successfulPayouts,
      failedPayouts,
      totalAmount,
    };
  }

  async getRecentPayments(limit: number = 10) {
    const payments = await this.paymentsRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return payments.map(p => ({
      paymentId: p.paymentId,
      amount: parseFloat(p.amount || '0'),
      status: p.paid ? 'PAID' : 'PENDING',
      createdAt: p.createdAt,
      userEmail: p.user?.email || 'Unknown',
    }));
  }
}
