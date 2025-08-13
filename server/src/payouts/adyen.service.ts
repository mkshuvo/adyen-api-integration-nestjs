import { Injectable } from '@nestjs/common';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { User } from '../entities/user.entity';
import { UserBankAccount } from '../entities/user_bank_account.entity';

export type AdyenPayoutResult = {
  status: 'submitted' | 'failed';
  pspReference?: string;
  message?: string;
};

@Injectable()
export class AdyenService {
  /**
   * submitPayout is a safe stub that readies request values and returns a simulated
   * response for now. We'll replace the internals with real Adyen API calls.
   */
  async submitPayout(
    payment: PayAccountingPayment,
    user: User,
    bank: UserBankAccount,
  ): Promise<AdyenPayoutResult> {
    const apiKey = process.env.ADYEN_API_KEY;
    const merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
    const env = process.env.ADYEN_ENV || 'test';

    // Prepare idempotency key and request payload placeholders
    const idempotencyKey = `payment-${payment.paymentId}`;
    const amount = Number(payment.amount ?? 0);

    if (!apiKey || !merchantAccount) {
      // Simulate a successful submission but annotate missing config
      return {
        status: 'submitted',
        pspReference: `SIM-${payment.paymentId}`,
        message: 'Adyen config missing; simulated submission',
      };
    }

    // TODO: Replace with real Adyen API request
    // - Use Checkout/Transfers/Balance Platform depending on your setup
    // - Include idempotency header
    // - Map bank details to receiver account per Adyen spec
    // - Capture PSP reference
    // For now, simulate a success path.
    return {
      status: 'submitted',
      pspReference: `SIM-${payment.paymentId}`,
      message: `Simulated ${env} payout for ${amount.toFixed(2)}`,
    };
  }
}
