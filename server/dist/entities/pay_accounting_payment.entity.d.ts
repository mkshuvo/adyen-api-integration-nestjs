import { User } from './user.entity';
import { PayoutAudit } from './payout_audit.entity';
export declare class PayAccountingPayment {
    paymentId: string;
    userId: number | null;
    user?: User | null;
    amount: string | null;
    paid: Date | null;
    paidMethod: string | null;
    paidTrackingId: string | null;
    paidSentTo: string | null;
    paidNotes: string | null;
    technicianW9Id: string | null;
    updatedAt: Date;
    createdAt: Date;
    audits: PayoutAudit[];
}
