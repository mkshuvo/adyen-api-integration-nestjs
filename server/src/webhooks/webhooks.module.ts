import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { PayoutAudit } from '../entities/payout_audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PayAccountingPayment, PayoutAudit])],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
