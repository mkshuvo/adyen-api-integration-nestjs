import { Module } from '@nestjs/common';
import { AdyenPayoutService } from './adyen-payout.service';
import { AdyenStatusService } from './adyen-status.service';

@Module({
  providers: [AdyenPayoutService, AdyenStatusService],
  exports: [AdyenPayoutService, AdyenStatusService],
})
export class AdyenModule {}
