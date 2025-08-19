# Adyen Sandbox Payout Platform

A full-stack TypeScript application for managing payouts to bank accounts using Adyen's sandbox environment. Built with NestJS backend, Next.js frontend, and MySQL database.

## 🏗️ Architecture

- **Backend**: NestJS + TypeORM + MySQL
- **Frontend**: Next.js 14 (App Router) + MUI v6
- **Payment Processing**: Adyen Node.js SDK
- **Authentication**: JWT with role-based access control
- **Containerization**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Adyen sandbox account (for real integration)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd adyen-integration
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings:

```env
# Database
DB_HOST=db
DB_PORT=3306
DB_USER=payout_user
DB_PASSWORD=payout_pass
DB_NAME=payout_db

# Application Ports
API_PORT=8054
WEB_PORT=9807

# JWT
JWT_SECRET=your-secret-key

# Adyen Configuration (Optional - will use stubs if not provided)
ADYEN_API_KEY=your-adyen-api-key
ADYEN_MERCHANT_ACCOUNT=your-merchant-account
ADYEN_HMAC_KEY=your-hmac-key
ADYEN_ENV=test
```

### 3. Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application

- **Frontend**: http://localhost:9807
- **Backend API**: http://localhost:8054
- **MySQL**: localhost:33117

## 🛠️ Development Setup

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start MySQL (via Docker)
docker-compose up db -d

# Run both apps concurrently
npm run dev

# Or run separately
npm run dev:server  # Backend only
npm run dev:ui      # Frontend only
```

## 👤 Default Users

The system comes with pre-seeded test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Accountant | accountant@example.com | password123 |

## 🔐 Authentication & Authorization

- **JWT-based authentication** with persistent login
- **Role-based access control** (RBAC):
  - **Admin**: Full access to users, bank accounts, and payouts
  - **Accountant**: Access to bank accounts and payouts
  - **Customer**: Limited access (future implementation)

## 💳 Features

### Backend (NestJS)

- ✅ **Authentication**: JWT login with bcrypt password hashing
- ✅ **User Management**: CRUD operations with role-based access
- ✅ **Bank Accounts**: IBAN/account validation and storage
- ✅ **Payouts**: Adyen integration with audit trails
- ✅ **Webhooks**: HMAC-verified Adyen notifications
- ✅ **Budget Control**: Balance platform integration
- ✅ **Database**: MySQL with TypeORM migrations

### Frontend (Next.js + MUI)

- ✅ **Authentication**: Login with JWT token management
- ✅ **Dashboard**: Payout statistics and recent transactions
- ✅ **Bank Accounts**: CRUD with IBAN/account number support
- ✅ **Payouts**: Create and track with expandable audit trails
- ✅ **Responsive Design**: Modern MUI components
- ✅ **Role Guards**: UI elements shown based on user permissions

## 🏦 Payout Flow

1. **Bank Account Setup**: Add and validate user bank accounts
2. **Payout Creation**: Submit payout with payment ID reference
3. **Adyen Processing**: 
   - Store bank details (tokenization)
   - Submit third-party payout
   - Confirm payout (if required)
4. **Webhook Handling**: Receive and process Adyen notifications
5. **Audit Trail**: Complete transaction history with status updates

## 📊 Database Schema

### Core Tables

- `users`: Authentication and role management
- `user_bank_account`: Bank account details with validation status
- `pay_accounting_payment`: Payment records with amounts and tracking
- `payout_audit`: Complete audit trail of payout operations

## 🧪 Testing

### Sandbox Connectivity Status

- Endpoint: `GET /api/integrations/adyen/status`
- RBAC: Requires authenticated role `admin` or `accountant`
- Environment guard: Only works when `ADYEN_ENVIRONMENT=test` (returns 400 otherwise)
- Returns structured JSON with environment, baseUrl, config presence, and connectivity probe result

Required env vars for probe:
- `ADYEN_ENVIRONMENT` = `test`
- `ADYEN_API_KEY`
- `ADYEN_BALANCE_ACCOUNT_ID`

Curl example (with JWT):
```bash
curl -H "Authorization: Bearer <JWT>" \
  http://localhost:8054/api/integrations/adyen/status
```

UI page:
- Visit `http://localhost:9807/status` (auto-refresh, manual refresh, error handling)

### API Testing

Use the seeded accounts to test the complete flow:

1. **Login** as admin or accountant
2. **Add Bank Account** for a user with IBAN or account details
3. **Validate Bank Account** to ensure it's ready for payouts
4. **Create Payout** using an existing payment ID
5. **Monitor Status** through the audit trail

### Sample API Calls

```bash
# Login
curl -X POST http://localhost:8054/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Add Bank Account (with JWT token)
curl -X POST http://localhost:8054/api/bank-accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "country": "NL",
    "currency": "EUR",
    "accountHolderName": "John Doe",
    "iban": "NL91ABNA0417164300"
  }'

# Submit Payout
curl -X POST http://localhost:8054/api/payouts/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "1000000001"}'
```

## 🔧 Configuration

### Adyen Integration

The application supports both **sandbox mode** (with stubs) and **real Adyen integration**:

- **Sandbox Mode**: Works without Adyen credentials using simulated responses
- **Live Integration**: Set `ADYEN_API_KEY`, `ADYEN_MERCHANT_ACCOUNT`, and `ADYEN_HMAC_KEY`

### Balance Platform

Optional Adyen Balance Platform integration:

```env
ADYEN_USE_BALANCE_PLATFORM=true
ADYEN_BALANCE_ACCOUNT_ID=your-balance-account-id
```

Fallback to budget limit:

```env
AVAILABLE_PAYOUT_BUDGET=10000.00
```

## 📁 Project Structure

```
├── server/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── bank-accounts/ # Bank account management
│   │   ├── payouts/       # Payout processing & Adyen
│   │   ├── webhooks/      # Adyen webhook handling
│   │   ├── entities/      # TypeORM entities
│   │   └── migrations/    # Database migrations
│   └── Dockerfile
├── ui/                    # Next.js Frontend
│   ├── app/              # App Router pages
│   ├── components/       # Reusable components
│   ├── lib/             # API client & auth store
│   └── Dockerfile
├── docker-compose.yml    # Multi-service orchestration
└── .env.example         # Environment template
```

## 🚢 Deployment

### Docker Production

```bash
# Production build
docker-compose -f docker-compose.yml up --build -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up --scale server=2 --scale ui=2
```

### Environment Variables

Ensure all required environment variables are set for production:

- Database credentials
- JWT secret (strong, random value)
- Adyen API credentials
- Proper CORS settings

## 🔍 Monitoring & Logs

- **Application Logs**: Available via `docker-compose logs`
- **Database**: MySQL accessible on port 33117
- **Health Checks**: Built-in for database connectivity
- **Audit Trail**: Complete payout operation history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
