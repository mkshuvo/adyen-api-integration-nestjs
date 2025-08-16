import { BadRequestException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { PayoutAudit } from '../entities/payout_audit.entity';
import { createHmac } from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(PayAccountingPayment) private readonly paymentsRepo: Repository<PayAccountingPayment>,
    @InjectRepository(PayoutAudit) private readonly auditRepo: Repository<PayoutAudit>,
  ) {}

  // Back-compat: simple header-based HMAC of raw JSON body
  private verifyHeaderJsonHmac(signature: string | undefined, body: any): void {
    const hmacKey = process.env.ADYEN_HMAC_KEY;
    if (!hmacKey) throw new BadRequestException('Missing HMAC key configuration');
    if (!signature) throw new UnauthorizedException('Missing signature');

    const payload = JSON.stringify(body);
    const expected = createHmac('sha256', Buffer.from(hmacKey, 'hex')).update(payload).digest('base64');
    if (signature !== expected) {
      throw new UnauthorizedException('Invalid HMAC signature');
    }
  }

  // Official Adyen HMAC helpers
  private escapeForHmac(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  }

  private buildDataToSign(item: any): string {
    const nri = item?.NotificationRequestItem ?? item;
    const pspReference = String(nri?.pspReference ?? '');
    const originalReference = String(nri?.originalReference ?? '');
    const merchantAccountCode = String(nri?.merchantAccountCode ?? '');
    const merchantReference = String(nri?.merchantReference ?? '');
    const amountValue = String(nri?.amount?.value ?? '');
    const amountCurrency = String(nri?.amount?.currency ?? '');
    const eventCode = String(nri?.eventCode ?? '');
    const success = String(nri?.success ?? '');

    const parts = [
      pspReference,
      originalReference,
      merchantAccountCode,
      merchantReference,
      amountValue,
      amountCurrency,
      eventCode,
      success,
    ].map((v) => this.escapeForHmac(v));

    return parts.join(':');
  }

  private verifyOfficialItemHmac(item: any, hmacKeyHex: string): void {
    const nri = item?.NotificationRequestItem ?? item;
    const provided = nri?.additionalData?.hmacSignature || nri?.additionalData?.['hmacSignature'];
    if (!provided) {
      throw new UnauthorizedException('Missing item hmacSignature');
    }
    const dataToSign = this.buildDataToSign(item);
    const expected = createHmac('sha256', Buffer.from(hmacKeyHex, 'hex')).update(dataToSign, 'utf8').digest('base64');
    if (provided !== expected) {
      throw new UnauthorizedException('Invalid item hmacSignature');
    }
  }

  private extractOfficialItems(body: any): any[] | null {
    if (!body || typeof body !== 'object') return null;
    if (Array.isArray(body.notificationItems)) {
      return body.notificationItems.map((x: any) => x?.NotificationRequestItem ?? x).filter(Boolean);
    }
    if (Array.isArray(body.notificationRequestItems)) {
      return body.notificationRequestItems.map((x: any) => x?.NotificationRequestItem ?? x).filter(Boolean);
    }
    return null;
  }

  async handleAdyen(signature: string | undefined, body: any) {
    const hmacKey = process.env.ADYEN_HMAC_KEY;
    if (!hmacKey) throw new BadRequestException('Missing HMAC key configuration');

    // Prefer official Adyen notification format with per-item HMAC validation if present
    const officialItems = this.extractOfficialItems(body);

    if (officialItems && officialItems.length > 0) {
      this.logger.log(`Received ${officialItems.length} Adyen notification item(s)`);

      for (const item of officialItems) {
        // Verify per-item HMAC
        this.verifyOfficialItemHmac(item, hmacKey);

        const nri = item?.NotificationRequestItem ?? item;
        const paymentIdStr = String(nri?.merchantReference ?? '').trim();
        if (!paymentIdStr) {
          this.logger.warn('Notification missing merchantReference; skipping');
          continue;
        }

        const payment = await this.paymentsRepo.findOne({ where: { paymentId: paymentIdStr } });
        if (!payment) {
          this.logger.warn(`Payment ${paymentIdStr} not found; skipping notification`);
          continue;
        }

        const status: string = String(nri?.eventCode ?? 'received');
        const success = String(nri?.success ?? '').toLowerCase() === 'true';
        const message: string | null = (nri?.reason as string | undefined) ?? null;
        const psp: string | null = (nri?.pspReference as string | undefined) ?? null;

        // Mark paid only on successful payout confirmation
        if (success && status === 'PAYOUT_CONFIRMED') {
          if (!payment.paid) {
            payment.paid = new Date();
            payment.paidMethod = 'adyen';
            payment.paidTrackingId = psp ?? null;
            await this.paymentsRepo.save(payment);
          }
        }

        const audit = this.auditRepo.create({
          paymentId: paymentIdStr,
          status: success ? status : `${status}_FAILED`,
          message: message ?? null,
          adyenPspReference: psp ?? null,
        });
        await this.auditRepo.save(audit);
      }
      return;
    }

    // Fallback: legacy simple JSON + header signature path
    this.verifyHeaderJsonHmac(signature, body);
    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      const paymentIdStr = String(item.payment_id ?? item.merchantReference ?? '').trim();
      if (!paymentIdStr) continue;

      const payment = await this.paymentsRepo.findOne({ where: { paymentId: paymentIdStr } });
      if (!payment) continue;

      const status: string = item.status || item.eventCode || 'received';
      const message: string | null = item.message || item.reason || null;
      const psp: string | null = item.pspReference || null;

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
