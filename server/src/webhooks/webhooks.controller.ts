import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post('adyen')
  @HttpCode(HttpStatus.OK)
  async adyen(@Headers('x-adyen-signature') signature: string | undefined, @Body() body: any) {
    await this.service.handleAdyen(signature, body);
    // Adyen expects 200 OK to acknowledge
    return { received: true };
  }
}
