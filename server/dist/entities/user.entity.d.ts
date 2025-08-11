import { PayAccountingPayment } from './pay_accounting_payment.entity';
import { UserBankAccount } from './user_bank_account.entity';
export declare class User {
    id: number;
    email: string;
    passwordHash: string;
    role: 'admin' | 'accountant';
    createdAt: Date;
    updatedAt: Date;
    bankAccounts: UserBankAccount[];
    payments: PayAccountingPayment[];
}
