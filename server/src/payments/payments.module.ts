import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import { User } from '../entities/user.entity';
import { UserBankAccount } from '../entities/user_bank_account.entity';
import { AdyenModule } from '../adyen/adyen.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayAccountingPayment, User, UserBankAccount]),
    AdyenModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
