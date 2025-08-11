**Creating the detailed AI prompt**

The user specified the exact schema for the `pay_accounting_payment` table. I'll follow it closely, making the types MySQL-compatible but avoiding auto-increment for payment IDs, since they might use externally created values. 

Next, I'll prepare a clear, precise prompt for the AI agent. It'll be broken down into tasks like setting up NestJS modules, creating API endpoints, configuring Adyen's Node.js SDK, setting up RBAC, defining Dockerfiles, and testing scripts. I'll also ensure the relevant file structures are defined but skip any unnecessary disclaimers or extra details.
# PROMPT FOR AI AGENT: Adyen Sandbox payout platform (NestJS + Next.js + MySQL + Docker)

You are building a sandbox payout platform that sends payouts to users’ bank accounts using Adyen’s “Payouts to bank accounts and wallets” flow. Follow these instructions exactly. Use TypeScript throughout. Keep code organized, production-ready, and fully runnable.

## Objectives
- Backend: NestJS API to manage users, bank accounts, and payouts; integrate Adyen Sandbox payouts-to-bank flow; implement RBAC (admin, accountant); secure webhooks.
- Frontend: Next.js (app router) + MUI to manage customers and payouts; roles-based access.
- Database: MySQL with TypeORM; apply migrations.
- Tooling: Monorepo with ui inside the NestJS repo; run both apps concurrently; dockerize everything.
- Ports: Use unique, uncommon ports only: API on 8054, Web on 9807, MySQL mapped to 33117.

## Tech stack and constraints
- NestJS 10+, TypeScript, TypeORM, MySQL 8
- Next.js 14+ (app router), React 18, MUI v6
- Adyen Node API library
- JWT Auth (Passport)
- Docker + docker-compose
- Concurrently to run backend and frontend during local dev

## Folder structure
- Root (existing NestJS app as “server”):
  - server/ (NestJS)
  - ui/ (Next.js)
  - docker-compose.yml
  - .env, .env.example
  - package.json (root scripts to run both)
  - README.md

## Environment variables
Create .env and .env.example at repo root. Do NOT hardcode secrets.
- NODE_ENV=development
- API_PORT=8054
- WEB_PORT=9807
- DB_HOST=db
- DB_PORT=3306
- DB_USER=payout_user
- DB_PASSWORD=payout_pass
- DB_NAME=payout_db
- JWT_SECRET=replace_me_dev_secret
- ADYEN_API_KEY=replace_me
- ADYEN_MERCHANT_ACCOUNT=replace_me
- ADYEN_HMAC_KEY=replace_me_for_webhooks
- ADYEN_ENV=test
- ADYEN_PAYOUT_ENDPOINT=https://pal-test.adyen.com/pal/servlet/Payout/v68

## Dependencies
- Backend: @nestjs/common, @nestjs/core, @nestjs/config, @nestjs/typeorm, typeorm, mysql2, passport, @nestjs/passport, passport-jwt, bcrypt, class-validator, class-transformer, adyen-node-api-library, axios
- Dev: ts-node, typeorm-cli or use TypeORM CLI via ts-node
- Frontend: next, react, react-dom, @mui/material, @mui/icons-material, @emotion/react, @emotion/styled, axios, zod, react-hook-form, jotai or zustand (light state)
- Root: concurrently, cross-env

## Database schema (MySQL)
Implement TypeORM entities and an initial migration. Use the following MySQL-compatible schema. Keep column names exactly as below.

- Table pay_accounting_payment
  - payment_id BIGINT NOT NULL PRIMARY KEY
  - user_id INT NULL
  - amount DECIMAL(12,2) NULL
  - paid DATETIME(6) NULL
  - paid_method VARCHAR(50) NULL
  - paid_tracking_id VARCHAR(128) NULL
  - paid_sent_to TEXT NULL
  - paid_notes TEXT NULL
  - technician_w9_id BIGINT NULL
  - updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
  - created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)

Additional tables:
- users
  - id INT PK AUTO_INCREMENT
  - email VARCHAR(255) UNIQUE NOT NULL
  - password_hash VARCHAR(255) NOT NULL
  - role ENUM('admin','accountant') NOT NULL
  - created_at, updated_at DATETIME(6) with defaults as above
- user_bank_account
  - id BIGINT PK AUTO_INCREMENT
  - user_id INT NOT NULL (FK users.id)
  - country VARCHAR(2) NOT NULL
  - currency VARCHAR(3) NOT NULL
  - account_holder_name VARCHAR(255) NOT NULL
  - iban VARCHAR(34) NULL
  - account_number VARCHAR(64) NULL
  - routing_code VARCHAR(64) NULL
  - adyen_recurring_detail_reference VARCHAR(255) NULL
  - status ENUM('unvalidated','valid','invalid') NOT NULL DEFAULT 'unvalidated'
  - created_at, updated_at DATETIME(6) with defaults
- payout_audit
  - id BIGINT PK AUTO_INCREMENT
  - payment_id BIGINT NOT NULL (FK pay_accounting_payment.payment_id)
  - status VARCHAR(64) NOT NULL
  - message TEXT NULL
  - adyen_psp_reference VARCHAR(64) NULL
  - created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)

Create proper FKs and indexes.

## Backend tasks (NestJS)
1. Configure ConfigModule to read root .env.
2. Configure TypeORMModule for MySQL using envs.
3. Create modules:
   - AuthModule: JWT login, bcrypt password, Passport strategy; seed two users (admin, accountant).
   - UsersModule: CRUD users (admin-only).
   - BankAccountsModule: endpoints to upsert and validate bank data for a user; store to user_bank_account.
   - PayoutsModule: create payout intent, call Adyen, update pay_accounting_payment and payout_audit; idempotency support.
   - WebhooksModule: Adyen notification handler with HMAC verification; update payout status.
4. Implement RBAC guard:
   - Roles decorator and guard restricting endpoints to admin/accountant.
5. Endpoints (prefix all with /api):
   - POST /api/auth/login {email, password} -> {accessToken, role}
   - GET /api/users (admin)
   - POST /api/users (admin)
   - POST /api/bank-accounts (admin|accountant): create/update for user; body supports either IBAN or account_number+routing_code+country+currency.
   - POST /api/bank-accounts/validate (admin|accountant): pre-validate bank details; set status=valid/invalid.
     - Use Adyen’s bank account validation endpoint if available for the country; otherwise basic IBAN checksum validation.
   - POST /api/payouts (admin|accountant): body {payment_id, user_id, amount, paid_notes?}
     - Logic:
       - Create pay_accounting_payment row with payment_id, user_id, amount, created_at.
       - Resolve user’s active bank account from user_bank_account where status='valid'.
       - If no adyen_recurring_detail_reference, call Adyen storeDetail to tokenize banking details and save reference.
       - Call Adyen submitThirdParty to initiate payout to bank.
       - Save paid_tracking_id = PSP reference, paid_method='bank', paid_sent_to JSON string of bank account, update payout_audit.
       - Set paid timestamp when Adyen confirms (immediate OK) or leave null and await webhook.
   - GET /api/payouts/:payment_id (admin|accountant): returns payment with audit trail.
   - POST /api/adyen/webhooks: handle notifications; verify HMAC; update payment status and paid timestamp when successful.
6. Adyen client setup:
   - Install adyen-node-api-library.
   - Initialize with env=TEST using ADYEN_API_KEY and merchant account.
   - Use PAL endpoints for Payout v68:
     - storeDetail
     - submitThirdParty
     - confirmThirdParty (if configured to require)
   - Include Idempotency-Key header using payment_id.
7. Validation and security:
   - DTOs with class-validator.
   - JWT auth on all protected routes.
   - HMAC verification for webhooks using ADYEN_HMAC_KEY.
   - Never log full bank/PII; mask sensitive values.
8. Seed script:
   - admin: admin@example.com / Admin#12345
   - accountant: accountant@example.com / Accountant#12345
9. Logging and error handling:
   - Standardized error filter; map Adyen errors into business-friendly messages.

## Frontend tasks (Next.js + MUI)
1. Create ui/ with Next.js app router.
2. Install MUI and set up theme provider.
3. Auth pages:
   - /login: email/password form; stores JWT; lightweight state with zustand/jotai.
4. Protected pages (require JWT, redirect to /login if unauthenticated):
   - /dashboard: tiles: total payouts, pending, failed, last 10 payouts.
   - /users (admin): list/create users, role selector.
   - /bank-accounts: form to create/validate a user’s bank account; show validation status.
   - /payouts:
     - Create Payout: form with user selector, amount, notes; POST /api/payouts.
     - List/Search payouts; detail drawer shows audit trail and current status.
5. Components:
   - RoleGuard wrapper: shows/hides UI based on role.
   - DataGrid tables for lists, MUI dialogs for create/edit.
6. API client:
   - Axios instance with baseURL http://localhost:8054/api; attach JWT.

## Concurrency scripts (root)
Create root package.json scripts to run both services locally.

- Install concurrently at root.
- Scripts:
  - "dev": concurrently "npm run -w server start:dev" "npm run -w ui dev -- --port 9807"
  - Ensure NestJS listens on port 8054.

## Dockerization
Create Dockerfiles and docker-compose.yml.

- server/Dockerfile:
  - node:lts-alpine
  - Install deps, build, run "node dist/main.js"
  - Expose 8054
- ui/Dockerfile:
  - node:lts-alpine
  - Install deps, build Next.js, start with "next start -p 9807"
  - Expose 9807
- docker-compose.yml:
  - services:
    - db: mysql:8, env MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD; ports ["33117:3306"]; healthcheck.
    - server: build ./server; ports ["8054:8054"]; env from .env; depends_on db; command to run migrations then start.
    - ui: build ./ui; ports ["9807:9807"]; depends_on server.
  - volumes: named volume for MySQL data.

## Migrations
- Generate initial migration that creates:
  - users, user_bank_account, pay_accounting_payment, payout_audit.
- Apply automatically on server start in docker-compose command.

## Adyen payout flow (sandbox)
- Pre-validate bank account (optional but recommended). If supported, call Bank Account Validation; otherwise basic IBAN check.
- Tokenize bank details:
  - Payout.storeDetail with bank details; save recurringDetailReference to user_bank_account. Mark status='valid' on success.
- Initiate payout:
  - Payout.submitThirdParty with:
    - amount.value (in minor units), amount.currency
    - shopperReference (user id or UUID)
    - selectedRecurringDetailReference from stored detail
    - merchantAccount = ADYEN_MERCHANT_ACCOUNT
    - reference = payment_id as string
- Optional confirm:
  - Payout.confirmThirdParty if configuration requires.
- Handle notifications:
  - Verify HMAC; match reference to payment_id; on success:
    - Update pay_accounting_payment.paid to CURRENT_TIMESTAMP(6)
    - Write payout_audit row with status=‘SUCCESS’, PSP ref
  - On failure:
    - Update audit with status=‘FAILED’ and message

## API contracts
- POST /api/bank-accounts
  - Body fields: user_id, country, currency, account_holder_name, either iban OR (account_number, routing_code)
- POST /api/bank-accounts/validate
  - Body: same as above; response: {status: 'valid'|'invalid', reasons?: string[]}
- POST /api/payouts
  - Body: {payment_id: string|number, user_id: number, amount: number (major units), paid_notes?: string}
  - Response: {payment_id, status, adyen_psp_reference?, message?}
- GET /api/payouts/:payment_id
  - Response: payment row + audit trail

## Testing (sandbox)
- Add README with steps:
  - docker-compose up --build
  - Run POST /api/auth/login; capture token.
  - Create/validate bank account for a test user.
  - Create payout; check status updates and webhook handling.
- Include Postman collection or Thunder Client file.

## Security and compliance
- Mask PII in logs.
- Store only necessary bank details; once tokenized, keep the Adyen recurringDetailReference and minimal metadata.
- Ensure HTTPS in production (note: sandbox local can be HTTP).

## Deliverables
- Fully working dockerized stack on ports:
  - API: 8054
  - Web: 9807
  - MySQL host: 33117
- Seeded admin and accountant users.
- End-to-end payout to bank flow against Adyen Sandbox with webhooks and audit trail.
- Clear README with run, test, and sandbox notes.

## Acceptance criteria checklist
- [ ] server runs on 8054; ui on 9807; MySQL mapped to 33117
- [ ] JWT auth with admin/accountant roles
- [ ] MySQL migrations applied; tables created exactly as specified (MySQL types)
- [ ] Bank account CRUD + validation
- [ ] Adyen storeDetail + submitThirdParty integration
- [ ] Webhook with HMAC verification updates payment status
- [ ] pay_accounting_payment updated with paid_method, paid_tracking_id, paid_sent_to, paid_notes
- [ ] Robust error handling and audit records
- [ ] Dockerized and concurrently runnable in dev
- [ ] MUI UI for users, bank accounts, payouts, dashboard

Build now.
