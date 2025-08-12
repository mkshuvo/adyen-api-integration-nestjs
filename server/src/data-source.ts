import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './entities/user.entity';
import { UserBankAccount } from './entities/user_bank_account.entity';
import { PayAccountingPayment } from './entities/pay_accounting_payment.entity';
import { PayoutAudit } from './entities/payout_audit.entity';
config();

const migrationsPath = process.env.NODE_ENV === 'production'
  ? 'dist/src/migrations/*.js'
  : 'src/migrations/*.{ts,js}';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  entities: [User, UserBankAccount, PayAccountingPayment, PayoutAudit],
  migrations: [migrationsPath],
  synchronize: false,
  timezone: 'Z',
});

