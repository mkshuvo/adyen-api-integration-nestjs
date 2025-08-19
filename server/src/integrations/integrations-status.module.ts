import { Module } from '@nestjs/common';
import { IntegrationsStatusController } from './integrations-status.controller';
import { AdyenModule } from '../adyen/adyen.module';

@Module({
  imports: [AdyenModule],
  controllers: [IntegrationsStatusController],
})
export class IntegrationsStatusModule {}
