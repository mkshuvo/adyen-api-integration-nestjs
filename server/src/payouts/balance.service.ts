import { Injectable, Logger } from '@nestjs/common';
import https from 'https';

/**
 * BalanceService provides an available balance figure used to gate payouts.
 *
 * For now, it reads from environment as a configurable budget. This is a safe
 * placeholder until we integrate Adyen balance APIs for your account type.
 *
 * Env options:
 * - AVAILABLE_PAYOUT_BUDGET: decimal string in major units (e.g. "10000.00").
 */
@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  getAvailableMajorUnits(): number {
    // Prefer Adyen Balance Platform if configured
    if (process.env.ADYEN_USE_BALANCE_PLATFORM === 'true') {
      try {
        const v = this.getFromAdyenBalancePlatformSync();
        if (typeof v === 'number' && Number.isFinite(v)) return v;
      } catch (err) {
        this.logger.warn(`Adyen balance fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const val = process.env.AVAILABLE_PAYOUT_BUDGET?.trim();
    if (!val) return Number.POSITIVE_INFINITY; // no cap configured
    const n = Number(val);
    if (Number.isNaN(n) || n < 0) return 0;
    return Math.floor(n * 100) / 100; // normalize to 2dp
  }

  // Synchronous wrapper for simplicity in current service (blocks briefly)
  private getFromAdyenBalancePlatformSync(): number | undefined {
    const apiKey = process.env.ADYEN_API_KEY;
    const balAccId = process.env.ADYEN_BALANCE_ACCOUNT_ID;
    const env = (process.env.ADYEN_ENV || 'test').toLowerCase();
    if (!apiKey || !balAccId) return undefined;

    const host = env === 'live'
      ? 'balanceplatform-api-live.adyen.com'
      : 'balanceplatform-api-test.adyen.com';
    const path = `/balancePlatform/balanceAccounts/${encodeURIComponent(balAccId)}/balances`;

    const res = this.httpGetJson({ host, path, headers: { 'X-API-Key': apiKey } });
    if (!res) return undefined;
    // Expected shape: { balances: [ { balance: { currency, value }, ... } ] } or similar
    // We attempt to find an 'available' or 'total' amount; fallback to sum of balances
    try {
      const balances = (res as any).balances as any[] | undefined;
      if (!Array.isArray(balances) || balances.length === 0) return undefined;
      // Try to find 'available' type entry first
      let minor = 0;
      for (const item of balances) {
        const amount = item?.balance ?? item?.available ?? item?.amount;
        const value = amount?.value;
        if (typeof value === 'number') minor += value; // sum minors conservatively
      }
      if (!minor) return undefined;
      const major = minor / 100.0;
      return Math.floor(major * 100) / 100;
    } catch {
      return undefined;
    }
  }

  private httpGetJson(opts: { host: string; path: string; headers?: Record<string, string> }): any | undefined {
    return this.blockingHttpsRequest(opts);
  }

  private blockingHttpsRequest(opts: { host: string; path: string; method?: string; headers?: Record<string, string>; body?: any }): any | undefined {
    const { host, path, method = 'GET', headers = {}, body } = opts;
    const payload = body ? JSON.stringify(body) : undefined;
    const options: https.RequestOptions = {
      host,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload).toString() } : {}),
        ...headers,
      },
    };

    // Block using deasync-like pattern with Atomics.wait via SharedArrayBuffer
    // to avoid adding extra deps. Keep timeouts short.
    const sab = new SharedArrayBuffer(4);
    const ia = new Int32Array(sab);
    let result: any | undefined;
    let error: any | undefined;

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          result = data ? JSON.parse(data) : undefined;
        } catch (e) {
          error = e;
        } finally {
          Atomics.store(ia, 0, 1);
          Atomics.notify(ia, 0, 1);
        }
      });
    });
    req.on('error', (e) => {
      error = e;
      Atomics.store(ia, 0, 1);
      Atomics.notify(ia, 0, 1);
    });
    if (payload) req.write(payload);
    req.setTimeout(4000, () => {
      error = new Error('Request timeout');
      req.destroy(error);
    });
    req.end();

    // Wait up to 4.5s
    Atomics.wait(ia, 0, 0, 4500);
    if (error) {
      this.logger.warn(`HTTPS error: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
    return result;
  }
}
