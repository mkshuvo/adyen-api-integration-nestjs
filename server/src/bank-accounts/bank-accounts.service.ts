import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserBankAccount } from '../entities/user_bank_account.entity';
import { UpsertBankAccountDto } from './dto/upsert-bank-account.dto';
import { ValidateBankAccountDto } from './dto/validate-bank-account.dto';
import { isValidIban } from './iban.util';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserBankAccount) private readonly baRepo: Repository<UserBankAccount>,
  ) {}

  async upsert(dto: UpsertBankAccountDto): Promise<UserBankAccount> {
    const user = await this.usersRepo.findOne({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('User not found');

    // Basic body validation: either IBAN or account_number+routing_code
    const hasIban = !!dto.iban;
    const hasLocal = !!dto.account_number && !!dto.routing_code;
    if (!hasIban && !hasLocal) {
      throw new BadRequestException('Provide either iban or account_number + routing_code');
    }

    // Auto-validate prior to persisting
    let ok = true;
    if (hasIban) {
      if (!isValidIban(dto.iban!)) {
        ok = false;
      }
    } else {
      if (!dto.account_number || dto.account_number.length < 6) ok = false;
      if (!dto.routing_code || dto.routing_code.length < 3) ok = false;
    }

    const existing = await this.baRepo.findOne({ where: { userId: user.id } });
    const bank: UserBankAccount =
      existing ??
      this.baRepo.create({ user, userId: user.id } as Partial<UserBankAccount>) as UserBankAccount;

    bank.country = dto.country.toUpperCase();
    bank.currency = dto.currency.toUpperCase();
    bank.accountHolderName = dto.account_holder_name;
    bank.iban = dto.iban ?? null;
    bank.accountNumber = dto.account_number ?? null;
    bank.routingCode = dto.routing_code ?? null;
    bank.status = ok ? 'valid' : 'invalid';
    bank.adyenRecurringDetailReference = null;

    return await this.baRepo.save(bank);
  }

  async validateAndSetStatus(dto: ValidateBankAccountDto): Promise<{ status: 'valid' | 'invalid'; reasons?: string[] }> {
    // For now: if IBAN present -> perform checksum; else basic length checks for local scheme
    let reasons: string[] = [];
    let ok = true;
    if (dto.iban) {
      if (!isValidIban(dto.iban)) {
        ok = false;
        reasons.push('Invalid IBAN checksum');
      }
    } else {
      if (!dto.account_number || dto.account_number.length < 6) {
        ok = false;
        reasons.push('account_number too short');
      }
      if (!dto.routing_code || dto.routing_code.length < 3) {
        ok = false;
        reasons.push('routing_code too short');
      }
    }

    const user = await this.usersRepo.findOne({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('User not found');
    const bank = await this.baRepo.findOne({ where: { userId: user.id } });
    if (!bank) throw new NotFoundException('Bank account not found');

    bank.status = ok ? 'valid' : 'invalid';
    await this.baRepo.save(bank);

    return { status: ok ? 'valid' : 'invalid', reasons: ok ? undefined : reasons } as const;
  }
}
