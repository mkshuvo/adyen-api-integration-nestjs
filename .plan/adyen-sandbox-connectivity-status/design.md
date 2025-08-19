---
description: Adyen Sandbox Connectivity Status – Design
---

# Architecture

- Backend: NestJS 11 in `server/`.
- New components:
  - `AdyenStatusService` (in `server/src/adyen/adyen-status.service.ts`): Encapsulates sandbox-only probe logic with timeout and redacted logging.
  - `IntegrationsStatusController` (in `server/src/integrations/integrations-status.controller.ts`): Exposes `GET /integrations/adyen/status`.
  - (Optional) `IntegrationsStatusModule` for clean separation, imports `ConfigModule`.

# Endpoint

- Method: GET
- Path: `/integrations/adyen/status`
- Auth: Requires authenticated user with role `admin` or `accountant` (reuse existing guards, see `auth/` and `components/role-guard.tsx` on UI if later exposed).
- Environment guard: Hard fail if `ADYEN_ENVIRONMENT !== 'test'` with 400 response: `{ message: 'status check is sandbox-only' }`.

## Request
- No body or query params.

## Response (200)
```json
{
  "environment": "test",
  "baseUrl": "https://balanceplatform-api-test.adyen.com/btl/v4",
  "hasApiKey": true,
  "hasBalanceAccountId": true,
  "connectivity": {
    "ok": true,
    "httpStatus": 200,
    "sampleCount": 1
  }
}
```

## Response (400 — live environment)
```json
{ "message": "status check is sandbox-only" }
```

## Response (502 — upstream issue/timeout)
```json
{
  "environment": "test",
  "baseUrl": "https://balanceplatform-api-test.adyen.com/btl/v4",
  "hasApiKey": true,
  "hasBalanceAccountId": true,
  "connectivity": {
    "ok": false,
    "httpStatus": 0,
    "error": "fetch timeout after 5000ms"
  }
}
```

# Service Logic

`AdyenStatusService.checkSandboxConnectivity()`
- Read config via `ConfigService`:
  - `ADYEN_ENVIRONMENT` (expect `test`), `ADYEN_API_KEY`, `ADYEN_BALANCE_ACCOUNT_ID`.
  - Base URL: `env === 'test' ? testUrl : liveUrl` (v4 `/btl/v4`).
- If env !== test → throw `BadRequestException('status check is sandbox-only')`.
- Build URL: `GET /transfers?balanceAccountId=...&limit=1`.
- Use native `fetch` with `AbortController` and 5s timeout.
- Headers: `Content-Type: application/json`, `X-API-Key: <apiKey>`.
- Log request/response metadata with API key redacted.
- Return structured status:
  - `connectivity.ok = res.ok`
  - `connectivity.httpStatus = res.status`
  - `connectivity.sampleCount = (json.data?.length) || 0`
  - On error/timeout: `ok=false`, `httpStatus=0`, `error=message`.

# Error Handling
- Input/config errors → 400 with explicit message.
- Network/timeout/5xx → 502 Bad Gateway mapping with structured payload.
- No secrets in logs or responses.

# Security
- RBAC: restrict endpoint to roles `admin` or `accountant`.
- Avoid leaking PSP references or sensitive details. Only meta booleans/integers are returned.

# Observability
- Structured logs: `category=adyen.status`, `env`, `base`, `httpStatus`, `ok`, `durationMs`.
- Redact `X-API-Key`.

# UI Design

- Framework: Next.js App Router in `ui/`.
- Route: `ui/app/status/page.tsx` → `GET http://localhost:9807/status`.
- Auth/RBAC: use existing `AuthGuard` and `RoleGuard` components to restrict to `admin` or `accountant`.
- Data source: call backend `GET /integrations/adyen/status` via `apiGet('/integrations/adyen/status')` from `ui/lib/api.ts`.
- Components:
  - `StatusCard` with props: `title`, `ok`, `subtitle?`, `tooltip?` — renders green/red indicator.
  - `ConfigList` showing booleans for `hasApiKey`, `hasBalanceAccountId` (no secrets displayed; mask any identifiers if needed).
- Behavior:
  - Show sections: Environment, Backend Reachability, Adyen Sandbox Connectivity, Config Presence.
  - Auto-refresh every 30s; manual Refresh button.
  - Error states:
    - 400 (live env): render warning banner "status check is sandbox-only (live env)".
    - Network/timeout: render `ok=false` with error tooltip and httpStatus=0.
  - Display `lastUpdated` timestamp.

# Deployment
- No new env vars required; `.env.example` already includes needed keys.
- CI step (optional): call endpoint after `server` is up and assert `connectivity.ok=true`.

# Testing Strategy
- Unit tests: mock `fetch` to simulate 200, timeout, 401.
- Integration test (sandbox): skip if env vars missing; otherwise assert 200 + `ok=true`.

# Future Enhancements
- UI admin page in `ui/` to display status.
- Additional probes (e.g., webhook HMAC check readiness).
