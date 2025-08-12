import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { PayoutAudit } from '../entities/payout_audit.entity';
import { User } from '../entities/user.entity';
import { UserBankAccount } from '../entities/user_bank_account.entity';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PayAccountingPayment, PayoutAudit, User, UserBankAccount])],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
