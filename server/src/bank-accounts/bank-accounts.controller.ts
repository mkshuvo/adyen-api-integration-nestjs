import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BankAccountsService } from './bank-accounts.service';
import { UpsertBankAccountDto } from './dto/upsert-bank-account.dto';
import { ValidateBankAccountDto } from './dto/validate-bank-account.dto';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankAccountsController {
  constructor(private readonly service: BankAccountsService) {}

  @Post()
  @Roles('admin', 'accountant')
  @HttpCode(HttpStatus.CREATED)
  async upsert(@Body() dto: UpsertBankAccountDto) {
    const ba = await this.service.upsert(dto);
    return { id: ba.id, user_id: ba.userId, status: ba.status };
  }

  @Post('validate')
  @Roles('admin', 'accountant')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() dto: ValidateBankAccountDto) {
    const result = await this.service.validateAndSetStatus(dto);
    return result;
  }
}
