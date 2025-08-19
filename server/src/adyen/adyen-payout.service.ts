import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TransferRequest {
  amount: {
    currency: string;
    value: number; // minor units
  };
  balanceAccountId: string;
  counterparty: {
    bankAccount: {
      countryCode: string;
      accountHolder: {
        fullName: string;
      };
      accountIdentification:
        | { iban: string }
        | { USLocalAccountIdentification: { accountNumber: string; routingNumber: string } }
        | { CALocalAccountIdentification: { accountNumber: string; institutionId: string; transitNumber: string } }
        | { GBLocalAccountIdentification: { accountNumber: string; sortCode: string } }
        | { AULocalAccountIdentification: { accountNumber: string; bsbNumber: string } };
    };
  };
  description: string;
  reference: string;
  priority?: 'regular' | 'fast' | 'wire' | 'instant' | 'crossBorder' | 'internal';
  priorities?: Array<'regular' | 'fast' | 'wire' | 'instant' | 'crossBorder' | 'internal'>;
}

interface TransferResponse {
  id: string;
  status: string;
  reference: string;
  amount: {
    currency: string;
    value: number;
  };
  counterparty: any;
}

@Injectable()
export class AdyenPayoutService {
  private readonly logger = new Logger(AdyenPayoutService.name);
  private readonly apiKey: string;
  private readonly merchantAccount: string;
  private readonly environment: string;
  private readonly baseUrl: string;

  private readonly balanceAccountId: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ADYEN_API_KEY') || '';
    this.merchantAccount = this.configService.get<string>('ADYEN_MERCHANT_ACCOUNT') || '';
    this.environment = this.configService.get<string>('ADYEN_ENVIRONMENT') || 'test';
    this.balanceAccountId = this.configService.get<string>('ADYEN_BALANCE_ACCOUNT_ID') || '';
    
    // Set base URL for Transfers API v4
    this.baseUrl = this.environment === 'live'
      ? 'https://balanceplatform-api-live.adyen.com/btl/v4'
      : 'https://balanceplatform-api-test.adyen.com/btl/v4';
  }

  /**
   * Create a transfer to a bank account using Transfers API v4
   * Following: https://docs.adyen.com/api-explorer/transfers/latest/post/transfers
   */
  async createBankTransfer(params: {
    amount: number;
    currency: string;
    reference: string;
    description: string;
    bankDetails: {
      iban?: string;
      accountNumber?: string;
      routingNumber?: string;
      accountHolderName: string;
      countryCode: string; // ISO 2
    };
    priority?: 'regular' | 'fast' | 'wire' | 'instant' | 'crossBorder' | 'internal';
    priorities?: Array<'regular' | 'fast' | 'wire' | 'instant' | 'crossBorder' | 'internal'>;
  }): Promise<TransferResponse> {
    try {
      const accountIdentification = this.buildAccountIdentification({
        countryCode: params.bankDetails.countryCode,
        iban: params.bankDetails.iban,
        accountNumber: params.bankDetails.accountNumber,
        routingNumber: params.bankDetails.routingNumber,
      });

      const transferRequest: TransferRequest = {
        amount: {
          currency: params.currency,
          value: Math.round(params.amount * 100),
        },
        balanceAccountId: this.balanceAccountId,
        counterparty: {
          bankAccount: {
            countryCode: params.bankDetails.countryCode,
            accountHolder: {
              fullName: params.bankDetails.accountHolderName,
            },
            accountIdentification,
          },
        },
        description: params.description,
        reference: params.reference,
        ...(params.priority && { priority: params.priority }),
        ...(params.priorities && { priorities: params.priorities }),
      };

      this.logger.log(`Creating bank transfer: ${JSON.stringify(transferRequest)}`);

      const response = await fetch(`${this.baseUrl}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(transferRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Adyen transfer failed: ${response.status} - ${errorText}`);
        throw new Error(`Adyen transfer failed: ${response.status} - ${errorText}`);
      }

      const result: TransferResponse = await response.json();
      this.logger.log(`Transfer response: ${JSON.stringify(result)}`);

      return result;
    } catch (error) {
      this.logger.error(`Error creating bank transfer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Backward-compatible wrapper used by PaymentsService.
   * Maps classic payout signature to Transfers v4 and returns a classic-like response.
   */
  async createBankPayout(params: {
    amount: number;
    currency: string;
    reference: string;
    bankDetails: {
      ownerName: string;
      countryCode: string;
      iban?: string;
      accountNumber?: string;
      routingNumber?: string;
    };
  }): Promise<{ resultCode: 'Authorised' | 'Received' | 'Error'; pspReference?: string; refusalReason?: string }>
  {
    try {
      const result = await this.createBankTransfer({
        amount: params.amount,
        currency: params.currency,
        reference: params.reference,
        description: `Payout for ${params.reference}`,
        bankDetails: {
          accountHolderName: params.bankDetails.ownerName,
          countryCode: params.bankDetails.countryCode,
          iban: params.bankDetails.iban,
          accountNumber: params.bankDetails.accountNumber,
          routingNumber: params.bankDetails.routingNumber,
        },
        priority: 'regular',
      });

      // Transfers API returns an id and status; map to classic-like fields
      return {
        resultCode: 'Authorised',
        pspReference: result.id,
      };
    } catch (e: any) {
      return {
        resultCode: 'Error',
        refusalReason: e?.message || 'Transfer failed',
      };
    }
  }

  /**
   * Build v4 accountIdentification from provided details
   */
  private buildAccountIdentification(input: {
    countryCode: string;
    iban?: string;
    accountNumber?: string;
    routingNumber?: string;
  }): TransferRequest['counterparty']['bankAccount']['accountIdentification'] {
    if (input.iban) {
      return { iban: input.iban };
    }

    const country = (input.countryCode || '').toUpperCase();
    // US: ACH routing number + account number
    if (country === 'US' && input.accountNumber && input.routingNumber) {
      return {
        USLocalAccountIdentification: {
          accountNumber: input.accountNumber,
          routingNumber: input.routingNumber,
        },
      };
    }

    // GB: sort code (6 digits) + account number
    if (country === 'GB' && input.accountNumber && input.routingNumber) {
      const sortCode = input.routingNumber.replace(/\D/g, '');
      if (sortCode.length !== 6) {
        throw new BadRequestException('GB payout requires a 6-digit sort code in routing_code.');
      }
      return {
        GBLocalAccountIdentification: {
          accountNumber: input.accountNumber,
          sortCode,
        },
      };
    }

    // AU: BSB (6 digits) + account number
    if (country === 'AU' && input.accountNumber && input.routingNumber) {
      const bsbNumber = input.routingNumber.replace(/\D/g, '');
      if (bsbNumber.length !== 6) {
        throw new BadRequestException('AU payout requires a 6-digit BSB in routing_code.');
      }
      return {
        AULocalAccountIdentification: {
          accountNumber: input.accountNumber,
          bsbNumber,
        },
      };
    }

    // CA: institutionId (3) + transitNumber (5) + account number
    if (country === 'CA' && input.accountNumber && input.routingNumber) {
      const raw = input.routingNumber.trim();
      const digits = raw.replace(/\D/g, '');

      let institutionId: string | null = null;
      let transitNumber: string | null = null;

      if (digits.length === 9 && digits.startsWith('0')) {
        // Electronic routing: 0 + institution(3) + transit(5)
        institutionId = digits.slice(1, 4);
        transitNumber = digits.slice(4, 9);
      } else {
        const parts = raw.split(/[-\s]/).filter(p => p);
        if (parts.length === 2) {
          const p1 = parts[0].replace(/\D/g, '');
          const p2 = parts[1].replace(/\D/g, '');
          // Common format: transit(5)-institution(3)
          if (p1.length === 5 && p2.length === 3) {
            transitNumber = p1;
            institutionId = p2;
          } else if (p1.length === 3 && p2.length === 5) {
            institutionId = p1;
            transitNumber = p2;
          }
        }
      }

      if (!institutionId || !transitNumber) {
        throw new BadRequestException('CA payout requires routing_code with institutionId (3) and transitNumber (5). Examples: "12345-003" or "012345678" (0 + institution + transit).');
      }

      return {
        CALocalAccountIdentification: {
          accountNumber: input.accountNumber,
          institutionId,
          transitNumber,
        },
      };
    }

    throw new BadRequestException('Unsupported bank account identification. Provide IBAN, or local details for US (routing), GB (sort code), AU (BSB), or CA (institution+transit).');
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId: string): Promise<TransferResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transfers/${transferId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get transfer status: ${response.status} - ${errorText}`);
      }

      const result: TransferResponse = await response.json();
      return result;
    } catch (error) {
      this.logger.error(`Error getting transfer status: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all transfers for the balance account
   */
  async listTransfers(limit: number = 10): Promise<{ data: TransferResponse[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/transfers?balanceAccountId=${this.balanceAccountId}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list transfers: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error listing transfers: ${error.message}`);
      throw error;
    }
  }
}
