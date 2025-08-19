# Adyen Sandbox Payouts – Requirements

## 1) Feature Overview
Implement end-to-end payouts from Adyen Balance Platform to customer bank accounts in sandbox. Support storing/validating bank details, initiating transfers using Transfers API v3, and observing statuses via logs/webhooks.

## 2) In Scope
- Add and validate customer bank accounts (IBAN or local account+routing).
- Initiate bank payouts using Adyen Transfers API v4.
- Persist payout results and link to payment records.
- Config via environment variables for sandbox.

## 3) Out of Scope (for this iteration)
- Card-to-card payouts.
- Full KYC onboarding flows (Legal Entity Management).
- Automatic funding of balance account.
- Production enablement (covered later).

## 4) APIs Used
- Transfers API v4: POST /transfers, GET /transfers/{id}, GET /transfers?balanceAccountId=...
- Optional: Payout webhooks (later iteration) to track status updates.

## 5) Tech Stack (server)
- NestJS: ^11.0.1 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- TypeORM: ^0.3.25, DB: MySQL (`mysql2`)
- Validation: `class-validator` ^0.14.2, `class-transformer` ^0.5.1
- Adyen: `@adyen/api-library` ^28.1.0 (we call Transfers REST directly)
- Node: per project setup; use the same Node as repo tooling

## 6) Data & Entities
- User bank account: country, currency, accountHolderName, iban?, accountNumber?, routingCode?, status.
- Payment: amount, currency, userId, payout tracking references.

## 7) Environment & Config (Sandbox)
- ADYEN_API_KEY: API key for Balance Platform credential (test)
- ADYEN_MERCHANT_ACCOUNT: your test merchant account code
- ADYEN_BALANCE_ACCOUNT_ID: BA_XXXXXXXXXX (when enabled); placeholder allowed for mock
- ADYEN_ENVIRONMENT: test

## 8) User Roles
- Admin/Accountant: manage bank accounts, trigger payouts.
- System: validates bank details and calls Adyen.
