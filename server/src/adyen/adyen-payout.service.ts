import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PayoutRequest {
  amount: {
    currency: string;
    value: number; // Amount in minor units (cents)
  };
  reference: string;
  payoutMethodCode: string;
  recurring?: {
    contract: string;
    recurringDetailReference: string;
  };
  card?: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
    holderName: string;
  };
  bank?: {
    iban?: string;
    ownerName: string;
    countryCode: string;
    bankAccountNumber?: string;
    bankLocationId?: string;
  };
  merchantAccount: string;
}

interface PayoutResponse {
  pspReference: string;
  resultCode: string;
  authCode?: string;
  refusalReason?: string;
}

@Injectable()
export class AdyenPayoutService {
  private readonly logger = new Logger(AdyenPayoutService.name);
  private readonly apiKey: string;
  private readonly merchantAccount: string;
  private readonly environment: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ADYEN_API_KEY') || '';
    this.merchantAccount = this.configService.get<string>('ADYEN_MERCHANT_ACCOUNT') || '';
    this.environment = this.configService.get<string>('ADYEN_ENVIRONMENT') || 'test';
    
    // Set base URL based on environment
    this.baseUrl = this.environment === 'live' 
      ? 'https://pal-live.adyenpayments.com/pal/servlet/Payout/v68'
      : 'https://pal-test.adyenpayments.com/pal/servlet/Payout/v68';
  }

  /**
   * Create a payout to a bank account
   * Following: https://docs.adyen.com/online-payments/online-payouts/payouts-to-a-bank-account/
   */
  async createBankPayout(params: {
    amount: number;
    currency: string;
    reference: string;
    bankDetails: {
      iban?: string;
      accountNumber?: string;
      routingNumber?: string;
      ownerName: string;
      countryCode: string;
    };
  }): Promise<PayoutResponse> {
    try {
      const payoutRequest: PayoutRequest = {
        amount: {
          currency: params.currency,
          value: Math.round(params.amount * 100), // Convert to minor units
        },
        reference: params.reference,
        payoutMethodCode: 'scheme', // For bank transfers
        merchantAccount: this.merchantAccount,
        bank: {
          ownerName: params.bankDetails.ownerName,
          countryCode: params.bankDetails.countryCode,
          ...(params.bankDetails.iban && { iban: params.bankDetails.iban }),
          ...(params.bankDetails.accountNumber && { 
            bankAccountNumber: params.bankDetails.accountNumber 
          }),
          ...(params.bankDetails.routingNumber && { 
            bankLocationId: params.bankDetails.routingNumber 
          }),
        },
      };

      this.logger.log(`Creating bank payout: ${JSON.stringify(payoutRequest)}`);

      const response = await fetch(`${this.baseUrl}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(payoutRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Adyen payout failed: ${response.status} - ${errorText}`);
        throw new Error(`Adyen payout failed: ${response.status} - ${errorText}`);
      }

      const result: PayoutResponse = await response.json();
      this.logger.log(`Payout response: ${JSON.stringify(result)}`);

      return result;
    } catch (error) {
      this.logger.error(`Error creating bank payout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Store payout details for recurring payouts
   */
  async storePayoutDetails(params: {
    shopperReference: string;
    bankDetails: {
      iban?: string;
      accountNumber?: string;
      routingNumber?: string;
      ownerName: string;
      countryCode: string;
    };
  }): Promise<{ recurringDetailReference: string }> {
    try {
      const storeRequest = {
        merchantAccount: this.merchantAccount,
        shopperReference: params.shopperReference,
        recurring: {
          contract: 'PAYOUT',
        },
        bank: {
          ownerName: params.bankDetails.ownerName,
          countryCode: params.bankDetails.countryCode,
          ...(params.bankDetails.iban && { iban: params.bankDetails.iban }),
          ...(params.bankDetails.accountNumber && { 
            bankAccountNumber: params.bankDetails.accountNumber 
          }),
          ...(params.bankDetails.routingNumber && { 
            bankLocationId: params.bankDetails.routingNumber 
          }),
        },
      };

      const response = await fetch(`${this.baseUrl}/storeDetail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(storeRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to store payout details: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return { recurringDetailReference: result.recurringDetailReference };
    } catch (error) {
      this.logger.error(`Error storing payout details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create payout using stored payment details
   */
  async createRecurringPayout(params: {
    amount: number;
    currency: string;
    reference: string;
    shopperReference: string;
    recurringDetailReference: string;
  }): Promise<PayoutResponse> {
    try {
      const payoutRequest: PayoutRequest = {
        amount: {
          currency: params.currency,
          value: Math.round(params.amount * 100),
        },
        reference: params.reference,
        payoutMethodCode: 'scheme',
        merchantAccount: this.merchantAccount,
        recurring: {
          contract: 'PAYOUT',
          recurringDetailReference: params.recurringDetailReference,
        },
      };

      const response = await fetch(`${this.baseUrl}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(payoutRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Recurring payout failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error creating recurring payout: ${error.message}`);
      throw error;
    }
  }
}
