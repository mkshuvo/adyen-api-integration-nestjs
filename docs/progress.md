# Project Progress Summary

Last updated: 2025-08-13

## Backend (NestJS)

- Authentication & Users
  - Implemented JWT login: `POST /api/auth/login` returns JWT with `id`, `email`, `role`.
  - Public customer registration: `POST /api/auth/register` creates a `customer` with hashed password and returns JWT.
  - Roles: `admin`, `accountant`, `customer`.
  - Admin/accountant users seeded for testing.

- Bank Accounts
  - Module: `server/src/bank-accounts/`
  - Upsert endpoint: `POST /api/bank-accounts` (roles: admin, accountant)
    - Auto-validates IBAN (mod-97) or local account length checks during upsert.
    - Persists with status `'valid'` or `'invalid'`.
  - Validate endpoint: `POST /api/bank-accounts/validate` (roles: admin, accountant)
    - Explicit re-check option; updates status accordingly.

- Payouts
  - Module: `server/src/payouts/`
  - Submit endpoint: `POST /api/payouts/submit` (roles: admin, accountant)
    - Input: `{ "payment_id": "<BIGINT-as-string>" }`
    - Validates payment exists, unpaid, linked user has a validated bank account.
    - Enforces budget check before initiating.
    - Idempotency: if an `initiated` audit already exists, returns `already_initiated`.
    - Creates `payout_audit` with `initiated`, then calls `AdyenService` (currently stub) and writes a follow-up `submitted`/`failed` audit including `pspReference`.

- Webhooks
  - Module: `server/src/webhooks/`
  - Endpoint: `POST /api/webhooks/adyen` (public)
    - Verifies HMAC using `ADYEN_HMAC_KEY` (hex), simple JSON-based signature.
    - Accepts single object or array.
    - Matches on `merchantReference` or `payment_id` and records audit (`status`, `message`, `pspReference`).
    - Marks payment `paid` when event indicates success (`PAYOUT_CONFIRMED`, `SUCCESS`, or `paid`).

- Balance/Budget Enforcement
  - `BalanceService` reads available balance for gating payouts:
    - If `ADYEN_USE_BALANCE_PLATFORM=true` and `ADYEN_API_KEY` + `ADYEN_BALANCE_ACCOUNT_ID` present, fetches from Adyen Balance Platform API (sandbox/live by `ADYEN_ENV`).
    - Else falls back to `AVAILABLE_PAYOUT_BUDGET` (decimal string, major units) or unlimited if unset.
  - `PayoutsService.submit()` compares `payment.amount` vs available and blocks if insufficient.

- Adyen Integration (current state)
  - `AdyenService.submitPayout()` is implemented as a safe stub that returns a simulated submission and PSP reference when config is missing.
  - The structure supports swapping in real Adyen for Platforms API calls with idempotency headers.

## Entities & Types

- `pay_accounting_payment.payment_id` is BIGINT stored as `string` in entities/services/DTOs to avoid precision loss.
- `payout_audit` records status, message, and `adyen_psp_reference`.
- `user_bank_account` stores IBAN or local details and `status` (`valid`/`invalid`).

## Environment Variables

- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Server: `API_PORT`, `JWT_SECRET`
- Adyen (general): `ADYEN_ENV` (test|live), `ADYEN_API_KEY`, `ADYEN_MERCHANT_ACCOUNT`, `ADYEN_CLIENT_KEY` (for frontend), `ADYEN_HMAC_KEY` (hex)
- Adyen (Platforms): `ADYEN_USE_BALANCE_PLATFORM=true`, `ADYEN_BALANCE_ACCOUNT_ID=balacc-...`
- Budget fallback: `AVAILABLE_PAYOUT_BUDGET=10000.00`

## How to Test Quickly (Sandbox)

1) Login to get JWT
- POST `http://localhost:8054/api/auth/login`
```json
{ "email": "admin@example.com", "password": "password123" }
```

2) Upsert bank account (admin/accountant)
- POST `http://localhost:8054/api/bank-accounts`
```json
{
  "user_id": 2,
  "country": "NL",
  "currency": "EUR",
  "account_holder_name": "Accountant Example",
  "iban": "NL91ABNA0417164300"
}
```

3) Submit payout
- POST `http://localhost:8054/api/payouts/submit`
```json
{ "payment_id": "1000000001" }
```
- Requires available budget and validated bank account.

4) Simulate webhook (HMAC)
- POST `http://localhost:8054/api/webhooks/adyen`
- Headers: `x-adyen-signature: <base64-hmac>`, `Content-Type: application/json`
```json
{
  "merchantReference": "1000000001",
  "eventCode": "PAYOUT_CONFIRMED",
  "pspReference": "testPSP123",
  "reason": "sandbox success"
}
```

## Decisions & Caveats

- Customer self-serve bank endpoints are not enabled yet; currently restricted to admin/accountant.
- Local account validation is basic (length checks); IBAN uses checksum only. No external validation yet.
- Adyen payout submission is stubbed; webhooks and audits are wired.
- Security hardening (field-level encryption, ownership checks for customer endpoints) planned.

## Next Steps

- Implement real Adyen for Platforms payout submission in `AdyenService` with idempotency.
- Finalize webhook schema handling to official Adyen notification format.
- Add BullMQ + Redis for scalable payout queues and retries.
- Frontend flows (registration, bank accounts, payouts, dashboard).
- README and API collection for testing.
