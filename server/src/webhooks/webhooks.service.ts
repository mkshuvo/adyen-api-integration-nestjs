import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { PayoutAudit } from '../entities/payout_audit.entity';
import { createHmac } from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(PayAccountingPayment) private readonly paymentsRepo: Repository<PayAccountingPayment>,
    @InjectRepository(PayoutAudit) private readonly auditRepo: Repository<PayoutAudit>,
  ) {}

  private verifyHmac(signature: string | undefined, body: any): void {
    const hmacKey = process.env.ADYEN_HMAC_KEY;
    if (!hmacKey) throw new BadRequestException('Missing HMAC key configuration');
    if (!signature) throw new UnauthorizedException('Missing signature');

    const payload = JSON.stringify(body);
    const expected = createHmac('sha256', Buffer.from(hmacKey, 'hex')).update(payload).digest('base64');
    if (signature !== expected) {
      throw new UnauthorizedException('Invalid HMAC signature');
    }
  }

  async handleAdyen(signature: string | undefined, body: any) {
    // In Adyen, you often receive an array of notifications; here we accept either a single object or array
    this.verifyHmac(signature, body);
    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      const paymentIdStr = String(item.payment_id ?? item.merchantReference ?? '').trim();
      if (!paymentIdStr) continue;

      const payment = await this.paymentsRepo.findOne({ where: { paymentId: paymentIdStr } });
      if (!payment) continue;

      const status: string = item.status || item.eventCode || 'received';
      const message: string | null = item.message || item.reason || null;
      const psp: string | null = item.pspReference || null;

      // Update paid timestamp if status indicates success
      if (status === 'PAYOUT_CONFIRMED' || status === 'SUCCESS' || status === 'paid') {
        if (!payment.paid) {
          payment.paid = new Date();
          payment.paidMethod = 'adyen';
          payment.paidTrackingId = psp ?? null;
          await this.paymentsRepo.save(payment);
        }
      }

      const audit = this.auditRepo.create({
        paymentId: paymentIdStr,
        status,
        message: message ?? null,
        adyenPspReference: psp ?? null,
      });
      await this.auditRepo.save(audit);
    }
  }
}
