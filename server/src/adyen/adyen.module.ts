import { Module } from '@nestjs/common';
import { AdyenPayoutService } from './adyen-payout.service';

@Module({
  providers: [AdyenPayoutService],
  exports: [AdyenPayoutService],
})
export class AdyenModule {}
