import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { PaymentsModule } from './payments/payments.module';
import { AdyenModule } from './adyen/adyen.module';
import { HealthModule } from './health/health.module';
import { User } from './entities/user.entity';
import { UserBankAccount } from './entities/user_bank_account.entity';
import { PayAccountingPayment } from './entities/pay_accounting_payment.entity';

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
        synchronize: true,
        entities: [User, UserBankAccount, PayAccountingPayment],
        timezone: 'Z',
      }),
    }),
    AuthModule,
    UsersModule,
    BankAccountsModule,
    PaymentsModule,
    AdyenModule,
    HealthModule,
  ],
})
export class AppModule {}
