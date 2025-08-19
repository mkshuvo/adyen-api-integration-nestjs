---
description: Adyen Sandbox Connectivity Status – Requirements
---

# Feature Overview

Expose a safe, read-only status check (sandbox-only) that verifies our Adyen Transfers API v4 integration and configuration without initiating any financial operations. The status should be consumable by engineering, operations, and CI pipelines to quickly determine:
- Environment is sandbox (never live).
- Required configuration is present (API key, balance account ID, environment).
- Adyen Transfers API v4 is reachable with our credentials.
- Returns a concise, non-sensitive JSON summary.

# Latest Research (Summary)
- Transfers API v4 base URLs:
  - Test: `https://balanceplatform-api-test.adyen.com/btl/v4`
  - Live: `https://balanceplatform-api-live.adyen.com/btl/v4`
- Auth: `X-API-Key: <ADYEN_API_KEY>` header.
- Read-only probe candidate: `GET /transfers?balanceAccountId={id}&limit=1` (no mutation; validates auth and permissions).
- Required envs in this project: `ADYEN_ENVIRONMENT`, `ADYEN_API_KEY`, `ADYEN_BALANCE_ACCOUNT_ID`.

# User Stories
- As an admin, I want a one-click way to confirm Adyen sandbox connectivity and config so I can triage issues fast.
- As a DevOps/SRE, I want a health endpoint to include in monitoring/CI pipelines to catch misconfigurations early.
- As a developer, I want to verify my local `.env` is correct without making a real payout.
- As an admin/accountant, I want a UI page at `http://localhost:9807/status` that clearly shows which API is functional (green) or not (red), with concise details.

# Acceptance Criteria
- Returns JSON with:
  - `environment` (must be `test`), `baseUrl`, `hasApiKey` (boolean), `hasBalanceAccountId` (boolean), `connectivity.ok` (boolean), `connectivity.httpStatus` (number), and optional `connectivity.sampleCount` (number) from the transfers list.
- NEVER calls live endpoints. If `ADYEN_ENVIRONMENT=live`, the endpoint must respond with 400 and `message: "status check is sandbox-only"`.
- No secrets in responses (no API key, no account numbers).
- Times out in ≤ 5s with an error summary when Adyen is unreachable.
- Zero side effects (read-only).
- Implement unit/integration tests:
  - Skip tests gracefully if required envs are missing.
  - In sandbox with valid creds, test asserts HTTP 200 and `connectivity.ok=true`.
- UI page at `/status` (Next.js) must:
  - Be accessible to authenticated `admin` or `accountant` roles.
  - Display cards for: Backend Reachability, Adyen Sandbox Connectivity, Config Presence (API key, balance account id), and Environment.
  - Use green/red indicators with short labels and tooltips for errors.
  - Never display secrets; mask IDs if shown.
  - Auto-refresh every 30s and allow manual refresh.

# Tech Stack & Versions
- Backend: NestJS 11, Node 22, TypeScript 5.7.x.
- HTTP: native fetch (Node 22) or `undici` if needed.
- No Adyen SDK required for the read-only probe.
- Config via `@nestjs/config` reading `.env`.

# Security & Compliance
- Sandbox-only guard (hard fail if `ADYEN_ENVIRONMENT!=='test'`).
- Do not log secrets. Redact headers in logs.
- Response contains only booleans/meta; no PII/financial data.
- GDPR/PCI: not applicable for this status endpoint, but follow least-privilege and no sensitive data exposure.

# Integration Points
- Backend endpoint: `GET /integrations/adyen/status` (sandbox-only).
- Internal service method: perform probe against Transfers v4 with API key.
- Frontend UI: Next.js page at `ui/app/status/page.tsx` consuming `/integrations/adyen/status` via `ui/lib/api.ts`.

# UI Requirements
- Route: `GET http://localhost:9807/status` (Next.js App Router).
- Auth: require login; show content only for `admin` or `accountant` via existing guards.
- Components:
  - StatusCard(title, ok, details?)
  - ConfigList showing booleans for `hasApiKey`, `hasBalanceAccountId` (masked values if ever displayed).
- Behavior:
  - Fetch from `${NEXT_PUBLIC_API_BASE}/integrations/adyen/status` using `apiGet()`.
  - Handle 400 (live env) with a warning state.
  - Show last-updated timestamp; auto-refresh interval: 30s.

# Constraints & Assumptions
- Requires `ADYEN_API_KEY` and `ADYEN_BALANCE_ACCOUNT_ID` valid for sandbox.
- Outbound internet access from server/CI runners to Adyen test endpoint.
- This feature is read-only; no payouts initiated.
- If Adyen test has intermittent issues, endpoint should surface a clear, actionable error.

# Non-Functional Requirements
- Performance: ≤ 300ms locally with warm network; ≤ 2s typical; hard timeout 5s.
- Reliability: endpoint should degrade gracefully with clear errors.
- Observability: structured logs for request/response metadata (no secrets).

# Out of Scope
- Live environment checks.
- Any write operations (creating transfers, counterparties, etc.).
- Aggregated business metrics (covered elsewhere).
