import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AdyenConnectivityStatus {
  environment: string;
  baseUrl: string;
  hasApiKey: boolean;
  hasBalanceAccountId: boolean;
  connectivity: {
    ok: boolean;
    httpStatus: number;
    sampleCount?: number;
    error?: string;
    durationMs?: number;
  };
}

@Injectable()
export class AdyenStatusService {
  private readonly logger = new Logger(AdyenStatusService.name);

  constructor(private readonly config: ConfigService) {}

  private getBaseUrl(env: string): string {
    if (env === 'test') return 'https://balanceplatform-api-test.adyen.com/btl/v4';
    if (env === 'live') return 'https://balanceplatform-api-live.adyen.com/btl/v4';
    // default to test base for unknown, but guard will prevent non-test execution
    return 'https://balanceplatform-api-test.adyen.com/btl/v4';
  }

  async checkSandboxConnectivity(): Promise<AdyenConnectivityStatus> {
    const environment = this.config.get<string>('ADYEN_ENVIRONMENT') || '';
    const apiKey = this.config.get<string>('ADYEN_API_KEY') || '';
    const balanceAccountId = this.config.get<string>('ADYEN_BALANCE_ACCOUNT_ID') || '';

    if (environment !== 'test') {
      throw new BadRequestException('status check is sandbox-only');
    }

    const baseUrl = this.getBaseUrl(environment);
    const hasApiKey = Boolean(apiKey);
    const hasBalanceAccountId = Boolean(balanceAccountId);

    const status: AdyenConnectivityStatus = {
      environment,
      baseUrl,
      hasApiKey,
      hasBalanceAccountId,
      connectivity: {
        ok: false,
        httpStatus: 0,
      },
    };

    // If config missing, short-circuit without network call
    if (!hasApiKey || !hasBalanceAccountId) {
      status.connectivity.ok = false;
      status.connectivity.error = 'missing configuration';
      return status;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `${baseUrl}/transfers?balanceAccountId=${encodeURIComponent(balanceAccountId)}&limit=1`;

    const startedAt = Date.now();
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      const durationMs = Date.now() - startedAt;
      let sampleCount: number | undefined = undefined;
      try {
        const data = await res.json().catch(() => null);
        if (data && Array.isArray((data as any).data)) {
          sampleCount = (data as any).data.length;
        }
      } catch {
        // ignore parse errors
      }
      status.connectivity = {
        ok: res.ok,
        httpStatus: res.status,
        sampleCount,
        durationMs,
      };
      this.logger.log(`probe status=${res.status} ok=${res.ok} dur=${durationMs}ms base=${baseUrl}`);
    } catch (err: any) {
      const durationMs = Date.now() - startedAt;
      const message = err?.name === 'AbortError' ? 'fetch timeout after 5000ms' : (err?.message || 'network error');
      status.connectivity = {
        ok: false,
        httpStatus: 0,
        error: message,
        durationMs,
      };
      this.logger.warn(`probe failed ok=false httpStatus=0 dur=${durationMs}ms base=${baseUrl} err=${message}`);
    } finally {
      clearTimeout(timeout);
    }

    return status;
  }
}
