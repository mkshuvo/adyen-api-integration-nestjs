import { PayAccountingPayment } from './pay_accounting_payment.entity';
export declare class PayoutAudit {
    id: string;
    paymentId: string;
    payment: PayAccountingPayment;
    status: string;
    message: string | null;
    adyenPspReference: string | null;
    createdAt: Date;
}
