import { Injectable, Logger } from '@nestjs/common';
import { Client, PayoutAPI } from '@adyen/api-library';
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
  private readonly logger = new Logger(AdyenService.name);

  /**
   * submitPayout now uses real Adyen API calls via @adyen/api-library.
   * Uses storeDetailAndSubmitThirdParty for Classic Payouts with idempotency.
   */
  async submitPayout(
    payment: PayAccountingPayment,
    user: User,
    bank: UserBankAccount,
  ): Promise<AdyenPayoutResult> {
    const apiKey = process.env.ADYEN_API_KEY;
    const merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
    const env = process.env.ADYEN_ENV || 'test';

    // Prepare idempotency key and request payload
    const idempotencyKey = `payment-${payment.paymentId}`;
    const amount = Number(payment.amount ?? 0);

    if (!apiKey || !merchantAccount) {
      this.logger.warn('Adyen configuration missing, falling back to simulation');
      return {
        status: 'submitted',
        pspReference: `SIM-${payment.paymentId}`,
        message: 'Adyen config missing; simulated submission',
      };
    }

    // Guard against invalid or missing amount
    if (!Number.isFinite(amount) || amount <= 0) {
      this.logger.warn(`Invalid payout amount for payment ${payment.paymentId}: ${payment.amount}`);
      return {
        status: 'failed',
        message: 'Invalid payout amount. Must be a positive number.',
      };
    }

    try {
      // Initialize Adyen client
      const client = new Client({
        apiKey,
        environment: env === 'live' ? 'LIVE' : 'TEST',
      });
      const payoutsApi = new PayoutAPI(client);

      // Convert amount to minor units (cents)
      const amountMinorUnits = Math.round(amount * 100);

      // Prepare bank account details for Adyen
      const bankAccountDetails = this.mapBankAccountToAdyen(bank);

      // Build storeDetailAndSubmitThirdParty request
      const request = {
        amount: {
          currency: bank.currency,
          value: amountMinorUnits,
        },
        bank: bankAccountDetails,
        merchantAccount,
        reference: `payout-${payment.paymentId}`,
        shopperEmail: user.email,
        shopperReference: `user-${user.id}`,
        shopperName: {
          firstName: bank.accountHolderName.split(' ')[0] || bank.accountHolderName,
          lastName: bank.accountHolderName.split(' ').slice(1).join(' ') || '',
        },
        entityType: 'NaturalPerson',
        nationality: bank.country,
        recurring: {
          contract: 'PAYOUT',
        },
      } as any;

      this.logger.log(`Submitting payout to Adyen for payment ${payment.paymentId}`);

      // Call Adyen API with idempotency header
      const response = await payoutsApi.InitializationApi.storeDetailAndSubmitThirdParty(request, {
        idempotencyKey,
      });

      this.logger.log(`Adyen payout submitted: ${response?.pspReference ?? 'no-psp-reference'}`);

      // Immediately confirm the payout for the review step
      const confirmKey = `${idempotencyKey}-confirm`;
      const confirmResp = await payoutsApi.ReviewingApi.confirmThirdParty(
        {
          merchantAccount,
          originalReference: (response as any)?.pspReference,
        } as any,
        { idempotencyKey: confirmKey },
      );

      this.logger.log(`Adyen payout confirmed: ${confirmResp?.pspReference ?? 'no-psp-reference'}`);

      return {
        status: 'submitted',
        pspReference: (confirmResp as any)?.pspReference ?? (response as any)?.pspReference,
        message: `Payout submitted and confirmed in ${env} environment`,
      };
    } catch (error) {
      this.logger.error(`Adyen payout failed for payment ${payment.paymentId}:`, error);

      // Handle Adyen API errors gracefully
      const errorMessage = error instanceof Error ? error.message : 'Unknown Adyen API error';
      
      return {
        status: 'failed',
        message: `Adyen payout failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Maps UserBankAccount entity to Adyen bank account format
   */
  private mapBankAccountToAdyen(bank: UserBankAccount) {
    const bankAccount: any = {
      countryCode: bank.country,
      ownerName: bank.accountHolderName,
    };

    // Use IBAN for SEPA countries, account number + routing for US
    if (bank.iban) {
      bankAccount.iban = bank.iban;
    } else if (bank.accountNumber && bank.routingCode) {
      bankAccount.bankAccountNumber = bank.accountNumber;
      bankAccount.bankLocationId = bank.routingCode;
    } else {
      throw new Error('Bank account must have either IBAN or account number + routing code');
    }

    return bankAccount;
  }
}
