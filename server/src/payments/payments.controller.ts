import { Body, Controller, Get, Post, Put, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { CreatePaymentDto } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('admin', 'accountant')
  async createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Get('pending')
  @Roles('admin', 'accountant')
  async getPendingPayments() {
    return this.paymentsService.getPendingPayments();
  }

  @Get('user/:userId')
  @Roles('admin', 'accountant')
  async getUserPayments(@Param('userId', ParseIntPipe) userId: number) {
    return this.paymentsService.getUserPayments(userId);
  }

  @Get('user/:userId/stats')
  @Roles('admin', 'accountant')
  async getUserStats(@Param('userId', ParseIntPipe) userId: number) {
    return this.paymentsService.getUserStats(userId);
  }

  @Get('dashboard/stats')
  @Roles('admin', 'accountant')
  async getDashboardStats() {
    return this.paymentsService.getDashboardStats();
  }

  @Get('recent')
  @Roles('admin', 'accountant')
  async getRecentPayments() {
    return this.paymentsService.getRecentPayments();
  }

  @Put(':paymentId/paid')
  @Roles('admin', 'accountant')
  async markAsPaid(
    @Param('paymentId') paymentId: string,
    @Body() body: { trackingId?: string }
  ) {
    return this.paymentsService.markAsPaid(paymentId, body.trackingId);
  }

  @Post(':paymentId/payout')
  @Roles('admin', 'accountant')
  async processAdyenPayout(@Param('paymentId') paymentId: string) {
    return this.paymentsService.processAdyenPayout(paymentId);
  }
}
