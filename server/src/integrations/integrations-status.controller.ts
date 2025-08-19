import { BadGatewayException, BadRequestException, Controller, Get, UseGuards } from '@nestjs/common';
import { AdyenStatusService } from '../adyen/adyen-status.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('integrations/adyen')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsStatusController {
  constructor(private readonly adyenStatus: AdyenStatusService) {}

  @Get('status')
  @Roles('admin', 'accountant')
  async getAdyenStatus() {
    try {
      const status = await this.adyenStatus.checkSandboxConnectivity();
      // Map upstream/timeout issues to 502 while preserving payload shape
      // Do NOT 502 for missing configuration
      if (
        status.environment === 'test' &&
        !status.connectivity.ok &&
        status.connectivity.httpStatus === 0 &&
        status.connectivity.error !== 'missing configuration'
      ) {
        throw new BadGatewayException(status);
      }
      return status;
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof BadGatewayException) {
        throw err;
      }
      throw new BadGatewayException({ message: 'upstream error', error: (err as any)?.message || 'error' });
    }
  }
}
