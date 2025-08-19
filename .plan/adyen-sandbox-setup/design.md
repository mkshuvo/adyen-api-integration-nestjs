---
description: Adyen Sandbox Payouts – System Design
---

# Architecture Overview

- Backend: NestJS monolith (`server/`) with modules: `auth/`, `bank-accounts/`, `payments/`, `adyen/`.
- Payouts: Implemented via Adyen Transfers API v4 (`btl/v4`).
- Persistence: TypeORM + MySQL. Entities: `User`, `UserBankAccount`, `PayAccountingPayment`.
- Frontend: Next.js app (`ui/`) interacts with REST endpoints.
- Config: `.env` with `ADYEN_*` keys; `ConfigService` injects values.

# Key Components

- `adyen/adyen-payout.service.ts`
  - Builds Transfers v4 payloads, posts to `/transfers`, polls `/transfers/{id}`.
  - Mapper for `accountIdentification`: IBAN, US ACH (extendable to CA/GB/AU).
  - Wrapper `createBankPayout()` maintains compatibility with existing callers.
- `bank-accounts/*`
  - Validates and persists bank account data (IBAN checksum, minimal field checks).
- `payments/*`
  - Creates payment records and triggers payouts against user’s saved bank account.

# Data Model & Schema

- UserBankAccount
  - id (pk), userId (fk)
  - country (ISO2), currency (ISO3)
  - accountHolderName
  - iban? (nullable)
  - accountNumber? (nullable)
  - routingCode? (nullable)
  - status: 'valid' | 'invalid'
  - createdAt, updatedAt
- PayAccountingPayment
  - id (pk)
  - paymentId (business id)
  - userId (fk)
  - amount (string decimal)
  - paid (datetime|null)
  - paidMethod (string|null)
  - paidTrackingId (string|null)
  - paidSentTo (json string|null)
  - paidNotes (string)
  - createdAt, updatedAt

# API Contracts

- POST `/bank-accounts`
  - Request (snake_case):
    {
      "user_id": 123,
      "country": "US",
      "currency": "USD",
      "account_holder_name": "Jane Doe",
      "account_number": "000111222",
      "routing_code": "021000021",
      "iban": null
    }
  - Response: { id, status }

- PUT `/bank-accounts/:id` similar shape as POST

- POST `/payments`
  - Request: { userId, amount, description? }
  - Response: payment object with `paymentId`

- POST `/payments/:paymentId/payout`
  - Triggers payout using `AdyenPayoutService.createBankPayout()`
  - Response: { success: boolean, pspReference?, error? }

- GET `/payments/recent?limit=10`
  - Response: array of recent payment summaries

- GET `/payments/dashboard/stats`
  - Response: { totalPayouts, pendingPayouts, successfulPayouts, failedPayouts, totalAmount }

# Transfers v4 Payload Mapping

- IBAN
  counterparty.bankAccount = {
    countryCode: "DE",
    accountHolder: { fullName: "Jane Doe" },
    accountIdentification: { iban: "DE89..." }
  }
- US ACH
  counterparty.bankAccount = {
    countryCode: "US",
    accountHolder: { fullName: "Jane Doe" },
    accountIdentification: {
      USLocalAccountIdentification: { accountNumber: "000...", routingNumber: "021000021" }
    }
  }
- GB (UK Sort Code)
  counterparty.bankAccount = {
    countryCode: "GB",
    accountHolder: { fullName: "Jane Doe" },
    accountIdentification: {
      GBLocalAccountIdentification: { accountNumber: "00000000", sortCode: "123456" }
    }
  }
- AU (BSB)
  counterparty.bankAccount = {
    countryCode: "AU",
    accountHolder: { fullName: "Jane Doe" },
    accountIdentification: {
      AULocalAccountIdentification: { accountNumber: "000000000", bsbNumber: "062000" }
    }
  }
- CA (Institution + Transit)
  counterparty.bankAccount = {
    countryCode: "CA",
    accountHolder: { fullName: "Jane Doe" },
    accountIdentification: {
      CALocalAccountIdentification: { accountNumber: "0000000", institutionId: "003", transitNumber: "12345" }
    }
  }

# Payout Flow (Sequence)

1. Client requests payout for `paymentId`.
2. `PaymentsService.processAdyenPayout()` loads payment + user bank account.
3. Builds bankDetails; calls `AdyenPayoutService.createBankPayout()`.
4. `AdyenPayoutService` maps to Transfers v4 request and posts `/transfers`.
5. On 200, returns `{ resultCode: 'Authorised', pspReference: <transfer.id> }`.
6. `PaymentsService` marks payment as paid, persists `paidTrackingId`.
7. Optional: poll `/transfers/{id}` for status or listen to webhooks later.

# Error Handling & Retries

- Validation: reject unsupported country/account combinations (clear 400 with message).
- HTTP errors: log response body, bubble up message. Map to `{ success:false, error }` for controller.
- Idempotency: use `reference` as idempotent key.
- Retries: for transient 5xx/network errors, retry with backoff (future: BullMQ queue).
- Status reconciliation: if uncertain, use `getTransferStatus(id)` to confirm.

# Security

- Secrets: `ADYEN_API_KEY`, `ADYEN_MERCHANT_ACCOUNT`, `ADYEN_BALANCE_ACCOUNT_ID`, `ADYEN_ENVIRONMENT` in `.env` (never commit).
- Webhooks: plan to add HMAC verification (`ADYEN_HMAC_KEY`) in later iteration.
- Logging: avoid PII; redact tokens in logs.
- RBAC: admin/accountant roles to trigger payouts.

# Deployment Plan

- Docker: use existing `server/Dockerfile` and docker-compose for local.
- Environments: `test` uses `https://balanceplatform-api-test.adyen.com/btl/v4`.
- Config injection via environment variables in container.
- CI: add `npm ci && npm run -w server build && npm run -w ui build`.

# Observability

- Structured logs around transfer requests/responses (without sensitive data).
- Add metrics counters for payout attempts/success/failures (future step).

# Risks & Mitigations

- Balance Platform not enabled: use mock BA id for dev; contact Adyen to enable.
- Country-specific requirements: add mappers per region (CA/GB/AU).
- Banking data quality: enforce IBAN checksum and format checks; stricter validation over time.
