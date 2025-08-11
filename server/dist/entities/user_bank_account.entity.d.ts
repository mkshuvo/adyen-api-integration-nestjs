import { User } from './user.entity';
export declare class UserBankAccount {
    id: string;
    userId: number;
    user: User;
    country: string;
    currency: string;
    accountHolderName: string;
    iban: string | null;
    accountNumber: string | null;
    routingCode: string | null;
    adyenRecurringDetailReference: string | null;
    status: 'unvalidated' | 'valid' | 'invalid';
    createdAt: Date;
    updatedAt: Date;
}
