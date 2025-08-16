import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PayoutsService } from './payouts.service';
import { SubmitPayoutDto } from './dto/submit-payout.dto';

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  constructor(private readonly service: PayoutsService) {}

  @Post('submit')
  @Roles('admin', 'accountant')
  @HttpCode(HttpStatus.ACCEPTED)
  async submit(@Body() dto: SubmitPayoutDto) {
    const res = await this.service.submit(dto.payment_id);
    return res;
  }

  @Get(':payment_id')
  @Roles('admin', 'accountant')
  @HttpCode(HttpStatus.OK)
  async getPayoutDetails(@Param('payment_id') paymentId: string) {
    const result = await this.service.getPayoutDetails(paymentId);
    return result;
  }
}
