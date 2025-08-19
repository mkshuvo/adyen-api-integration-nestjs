import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdyenStatusService } from './adyen-status.service';

describe('AdyenStatusService', () => {
  let service: AdyenStatusService;
  let configValues: Record<string, string>;

  class MockConfigService {
    get<T = any>(key: string): T | undefined {
      return configValues[key] as any;
    }
  }

  beforeEach(() => {
    configValues = {
      ADYEN_ENVIRONMENT: 'test',
      ADYEN_API_KEY: '',
      ADYEN_BALANCE_ACCOUNT_ID: '',
    };
    service = new AdyenStatusService(new MockConfigService() as unknown as ConfigService);
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws 400 when environment is not test', async () => {
    configValues.ADYEN_ENVIRONMENT = 'live';

    await expect(service.checkSandboxConnectivity()).rejects.toBeInstanceOf(BadRequestException);
    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it('short-circuits with missing configuration (no network call)', async () => {
    configValues.ADYEN_ENVIRONMENT = 'test';
    configValues.ADYEN_API_KEY = '';
    configValues.ADYEN_BALANCE_ACCOUNT_ID = '';

    const res = await service.checkSandboxConnectivity();
    expect(res.environment).toBe('test');
    expect(res.hasApiKey).toBe(false);
    expect(res.hasBalanceAccountId).toBe(false);
    expect(res.connectivity.ok).toBe(false);
    expect(res.connectivity.error).toBe('missing configuration');
    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it('handles 200 OK with sampleCount', async () => {
    configValues.ADYEN_API_KEY = 'test-key';
    configValues.ADYEN_BALANCE_ACCOUNT_ID = 'BA123';

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [ { id: 't1' } ] }),
    });

    const res = await service.checkSandboxConnectivity();
    expect(res.connectivity.ok).toBe(true);
    expect(res.connectivity.httpStatus).toBe(200);
    expect(res.connectivity.sampleCount).toBe(1);
    expect(res.connectivity.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('handles 401 Unauthorized', async () => {
    configValues.ADYEN_API_KEY = 'bad-key';
    configValues.ADYEN_BALANCE_ACCOUNT_ID = 'BA123';

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const res = await service.checkSandboxConnectivity();
    expect(res.connectivity.ok).toBe(false);
    expect(res.connectivity.httpStatus).toBe(401);
  });

  it('handles timeout via AbortError', async () => {
    configValues.ADYEN_API_KEY = 'test-key';
    configValues.ADYEN_BALANCE_ACCOUNT_ID = 'BA123';

    (global as any).fetch = jest.fn().mockRejectedValue({ name: 'AbortError' });

    const res = await service.checkSandboxConnectivity();
    expect(res.connectivity.ok).toBe(false);
    expect(res.connectivity.httpStatus).toBe(0);
    expect(res.connectivity.error).toBe('fetch timeout after 5000ms');
  });
});
