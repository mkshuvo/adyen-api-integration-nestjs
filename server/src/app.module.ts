import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { UserBankAccount } from './entities/user_bank_account.entity';
import { PayAccountingPayment } from './entities/pay_accounting_payment.entity';
import { PayoutAudit } from './entities/payout_audit.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { PayoutsModule } from './payouts/payouts.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'test',
        // Do NOT use synchronize in production. We will add migrations later per prompt.
        synchronize: false,
        entities: [User, UserBankAccount, PayAccountingPayment, PayoutAudit],
        timezone: 'Z',
      }),
    }),
    TypeOrmModule.forFeature([User, UserBankAccount, PayAccountingPayment, PayoutAudit]),
    AuthModule,
    UsersModule,
    BankAccountsModule,
    PayoutsModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
