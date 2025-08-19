---
description: Adyen Sandbox Connectivity Status – Developer Tasks
---

# Task List

- __[TASK-001] Create AdyenStatusService__
  - Description: Implement `AdyenStatusService.checkSandboxConnectivity()` to perform a sandbox-only, read-only probe against Transfers v4.
  - Details:
    - Read `ADYEN_ENVIRONMENT`, `ADYEN_API_KEY`, `ADYEN_BALANCE_ACCOUNT_ID` via `ConfigService`.
    - Guard: if env !== `test` → throw `BadRequestException('status check is sandbox-only')`.
    - Build URL: `GET /btl/v4/transfers?balanceAccountId=...&limit=1` using the test base URL.
    - Use native `fetch` with `AbortController` and 5s timeout.
    - Headers: `Content-Type: application/json`, `X-API-Key`.
    - Redacted logging (never log API key or sensitive data).
    - Return structured DTO: `{ environment, baseUrl, hasApiKey, hasBalanceAccountId, connectivity: { ok, httpStatus, sampleCount?, error? } }`.
  - Deliverables: `server/src/adyen/adyen-status.service.ts` + unit tests.
  - Dependencies: ConfigModule.
  - Effort: 2h
  - Priority: high

- __[TASK-002] Add IntegrationsStatusController endpoint__
  - Description: Expose `GET /integrations/adyen/status` that calls `AdyenStatusService` and applies RBAC.
  - Details:
    - Apply auth guard + roles guard (allow: admin, accountant).
    - Map upstream/network errors to 502 with structured payload.
  - Deliverables: `server/src/integrations/integrations-status.controller.ts`.
  - Dependencies: TASK-001, existing AuthModule/guards.
  - Effort: 1.5h
  - Priority: high

- __[TASK-003] Wire module__
  - Description: Create `IntegrationsStatusModule` that provides the controller and imports `ConfigModule`. Import module in `AppModule`.
  - Deliverables: `server/src/integrations/integrations-status.module.ts`, `AppModule` change.
  - Dependencies: TASK-001, TASK-002
  - Effort: 0.5h
  - Priority: high

- __[TASK-004] Unit tests for AdyenStatusService__
  - Description: Mock `fetch` for scenarios: 200 OK, 401 Unauthorized, timeout, live-env guard.
  - Deliverables: `server/src/adyen/adyen-status.service.spec.ts`.
  - Dependencies: TASK-001
  - Effort: 2h
  - Priority: high

- __[TASK-005] E2E test for endpoint__
  - Description: Add e2e spec hitting `GET /integrations/adyen/status`.
  - Details:
    - Skip if required env vars missing.
    - In sandbox with creds, assert 200 and `connectivity.ok === true`.
  - Deliverables: `server/test/adyen-status.e2e-spec.ts` (Jest e2e config exists in `server/test/jest-e2e.json`).
  - Dependencies: TASK-002, TASK-003
  - Effort: 1.5h
  - Priority: medium

- __[TASK-006] Structured logging & redaction__
  - Description: Add structured logs: category=adyen.status, env, base, httpStatus, ok, durationMs. Redact `X-API-Key`.
  - Deliverables: logging statements in service; verify no secrets printed.
  - Dependencies: TASK-001
  - Effort: 0.5h
  - Priority: medium

- __[TASK-009] UI page at /status (Next.js)__
  - Description: Implement `ui/app/status/page.tsx` to display connectivity status with green/red indicators.
  - Details:
    - Fetch via `apiGet('/integrations/adyen/status')` from `ui/lib/api.ts`.
    - Sections: Environment, Backend Reachability, Adyen Sandbox Connectivity, Config Presence.
    - Auto-refresh every 30s; manual Refresh button; show `lastUpdated`.
    - Handle 400 (live env) with warning banner; handle timeouts with `ok=false` and tooltip.
  - Deliverables: `ui/app/status/page.tsx`.
  - Dependencies: TASK-002, TASK-003
  - Effort: 2h
  - Priority: high

- __[TASK-010] UI components (StatusCard, ConfigList)__
  - Description: Build reusable components used by `/status` page.
  - Details:
    - `StatusCard({ title, ok, subtitle?, tooltip? })` with green/red indicator.
    - `ConfigList({ hasApiKey, hasBalanceAccountId })` (never render secrets; mask if needed).
  - Deliverables: `ui/components/status-card.tsx`, `ui/components/config-list.tsx`.
  - Dependencies: TASK-009
  - Effort: 1h
  - Priority: medium

- __[TASK-011] UI RBAC integration__
  - Description: Restrict `/status` page to `admin` or `accountant` roles.
  - Details:
    - Wrap with existing `AuthGuard` and `RoleGuard` components.
  - Deliverables: Guarded page composition in `ui/app/status/page.tsx`.
  - Dependencies: TASK-009
  - Effort: 0.5h
  - Priority: medium

- __[TASK-012] UI test(s)__
  - Description: Add lightweight tests or manual acceptance checklist for `/status` page.
  - Details:
    - If test harness present, add React Testing Library test to render cards based on mocked fetch.
    - Otherwise, document manual acceptance steps in README (load `/status`, verify indicators, RBAC, auto-refresh).
  - Deliverables: `ui/__tests__/status.test.tsx` (if infra exists) or README steps.
  - Dependencies: TASK-009, TASK-010, TASK-011
  - Effort: 1h
  - Priority: low

- __[TASK-007] Documentation updates__
  - Description: Document the new endpoint and how to run the status check.
  - Deliverables: README section and `.env.example` verification (already contains keys).
  - Dependencies: TASK-002
  - Effort: 0.5h
  - Priority: low

- __[TASK-008] Optional CI check__
  - Description: Add CI step (post-server-start) to curl `/integrations/adyen/status` and assert `connectivity.ok`.
  - Deliverables: CI script update (GitHub Actions or pipeline in use).
  - Dependencies: TASK-002, TASK-003
  - Effort: 1h
  - Priority: low

# Execution Order
1) TASK-001
2) TASK-002
3) TASK-003
4) TASK-004
5) TASK-005
6) TASK-006
7) TASK-009
8) TASK-010
9) TASK-011
10) TASK-012
11) TASK-007
12) TASK-008 (optional)

# Acceptance Criteria Mapping
- Requirements: environment `test` only, config presence booleans, read-only probe, ≤5s timeout, structured response, no secrets.
- Tests: service unit tests and e2e spec; skip gracefully if env missing.
- Security: RBAC on controller; no live calls.
