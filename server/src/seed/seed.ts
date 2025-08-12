import 'reflect-metadata';
import { config } from 'dotenv';
import { AppDataSource } from '../data-source';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserBankAccount } from '../entities/user_bank_account.entity';
import { PayAccountingPayment } from '../entities/pay_accounting_payment.entity';
import * as bcrypt from 'bcrypt';

config();

async function ensureUser(repo: Repository<User>, email: string, role: 'admin' | 'accountant', password: string) {
  let user = await repo.findOne({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = repo.create({ email, passwordHash, role });
    await repo.save(user);
    console.log(`Created ${role} user: ${email}`);
  } else {
    console.log(`${role} user exists: ${email}`);
  }
}

async function run() {
  await AppDataSource.initialize();
  try {
    const usersRepo = AppDataSource.getRepository(User);
    const bankRepo = AppDataSource.getRepository(UserBankAccount);
    const payRepo = AppDataSource.getRepository(PayAccountingPayment);

    await ensureUser(usersRepo, 'admin@example.com', 'admin', 'password123');
    await ensureUser(usersRepo, 'accountant@example.com', 'accountant', 'password123');

    // Ensure a sample bank account for accountant user
    const accountant = await usersRepo.findOne({ where: { email: 'accountant@example.com' } });
    if (accountant) {
      const existingBA = await bankRepo.findOne({ where: { user: { id: accountant.id } as any } });
      if (!existingBA) {
        const ba = bankRepo.create({
          user: accountant,
          country: 'NL',
          currency: 'EUR',
          accountHolderName: 'Accountant Example',
          iban: 'NL91ABNA0417164300',
          status: 'unvalidated',
        });
        await bankRepo.save(ba);
        console.log('Created sample bank account for accountant');
      } else {
        console.log('Sample bank account already exists for accountant');
      }

      // Ensure a sample payment row
      const samplePaymentId = '1000000001'; // BIGINT stored as string in entity
      let payment = await payRepo.findOne({ where: { paymentId: samplePaymentId } });
      if (!payment) {
        payment = payRepo.create({
          paymentId: samplePaymentId,
          user: accountant,
          amount: '250.00',
          paid: null,
          paidMethod: null,
          paidTrackingId: null,
          paidSentTo: null,
          paidNotes: 'Sample seeded payment',
          technicianW9Id: null,
        });
        await payRepo.save(payment);
        console.log('Created sample pay_accounting_payment row');
      } else {
        console.log('Sample payment already exists');
      }
    }

    console.log('Seeding completed.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

run();
