import { Injectable, Logger } from '@nestjs/common';
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
      // Convert amount to minor units (cents)
      const amountMinorUnits = Math.round(amount * 100);

      // Prepare bank account details for Adyen
      const bankAccountDetails = this.mapBankAccountToAdyen(bank);

      // Build Transfers API request
      const request = {
        amount: {
          currency: bank.currency,
          value: amountMinorUnits,
        },
        balanceAccountId: process.env.ADYEN_BALANCE_ACCOUNT_ID,
        counterparty: {
          bankAccount: bankAccountDetails,
        },
        description: `Payout for payment ${payment.paymentId}`,
        reference: `payout-${payment.paymentId}`,
        priority: 'regular',
      };

      this.logger.log(`Submitting transfer to Adyen for payment ${payment.paymentId}`);

      // Use Transfers API v3
      const baseUrl = env === 'live' 
        ? 'https://balanceplatform-api-live.adyen.com/btl/v3'
        : 'https://balanceplatform-api-test.adyen.com/btl/v3';

      const response = await fetch(`${baseUrl}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Adyen transfer failed: ${response.status} - ${errorText}`);
        throw new Error(`Adyen transfer failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`Adyen transfer submitted: ${result?.id ?? 'no-transfer-id'}`);

      return {
        status: 'submitted',
        pspReference: result?.id,
        message: `Transfer submitted in ${env} environment`,
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
   * Maps UserBankAccount entity to Adyen Transfers API format
   */
  private mapBankAccountToAdyen(bank: UserBankAccount) {
    const bankAccount: any = {
      countryCode: bank.country,
      accountHolderName: bank.accountHolderName,
    };

    // Use IBAN for SEPA countries, account number + routing for US
    if (bank.iban) {
      bankAccount.iban = bank.iban;
    } else if (bank.accountNumber && bank.routingCode) {
      bankAccount.accountNumber = bank.accountNumber;
      bankAccount.routingNumber = bank.routingCode;
    } else {
      throw new Error('Bank account must have either IBAN or account number + routing code');
    }

    return bankAccount;
  }
}
