# Adyen Integration - Production Deployment Guide

## 🚀 Production Deployment Checklist

### Prerequisites
- [ ] Production MySQL/PostgreSQL database
- [ ] Adyen Live API credentials
- [ ] SSL certificates for HTTPS
- [ ] Production domain configured
- [ ] Docker and Docker Compose installed

### 1. Environment Configuration

Copy and configure production environment:
```bash
cp .env.production .env
```

**CRITICAL**: Update these values in `.env`:
```bash
# Database
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-db-password
DB_NAME=adyen_payout_production

# Security - MUST CHANGE
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum

# Adyen Live Credentials
ADYEN_API_KEY=your-live-adyen-api-key
ADYEN_MERCHANT_ACCOUNT=your-merchant-account
ADYEN_HMAC_KEY=your-production-hmac-key

# Domain
CORS_ORIGINS=https://your-production-domain.com
```

### 2. Database Setup

Initialize production database:
```bash
# Create database and user
mysql -u root -p -e "CREATE DATABASE adyen_payout_production;"
mysql -u root -p -e "CREATE USER 'your-user'@'%' IDENTIFIED BY 'your-password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON adyen_payout_production.* TO 'your-user'@'%';"
```

### 3. Deploy Application

```bash
# Build and start production containers
docker-compose -f docker-compose.production.yml up -d --build

# Check container health
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 4. SSL/HTTPS Setup

Configure reverse proxy (nginx example):
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:9807;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:8054;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. Adyen Webhook Configuration

Configure webhook endpoint in Adyen Customer Area:
- **URL**: `https://your-domain.com/api/webhooks/adyen`
- **Method**: POST
- **HMAC Key**: Use the same key as `ADYEN_HMAC_KEY`

### 6. Health Checks

Verify deployment:
```bash
# API health
curl https://your-domain.com/api/health

# Database connection
curl https://your-domain.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 7. Monitoring Setup

Add monitoring for:
- Container health status
- Database connections
- API response times
- Adyen webhook deliveries
- Payment processing errors

### 8. Backup Strategy

Configure automated backups:
```bash
# Database backup script
#!/bin/bash
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use secrets management in production (AWS Secrets Manager, etc.)
- Rotate JWT secrets regularly

### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict database access by IP
- Regular security updates

### API Security
- Rate limiting enabled
- CORS properly configured
- Input validation on all endpoints
- Audit logging enabled

## 📊 Production Features

### Available Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/payments/dashboard/stats` - Dashboard metrics
- `GET /api/payments/recent` - Recent payments
- `GET /api/bank-accounts` - Bank accounts list
- `POST /api/payments/:paymentId/payout` - Execute payout
- `POST /api/webhooks/adyen` - Adyen webhook handler

### User Roles
- **admin**: Full system access
- **accountant**: Payment and bank account management
- **customer**: Limited access (future feature)

### Payout Flow
1. Create payment record
2. Add/validate bank account
3. Execute payout via Adyen API
4. Receive webhook confirmation
5. Update payment status

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check database container
docker logs adyen-integration-db-prod

# Test connection
docker exec -it adyen-integration-db-prod mysql -u $DB_USER -p
```

**Adyen API Errors**
```bash
# Check server logs
docker logs adyen-integration-server-prod

# Verify credentials in Adyen Customer Area
# Ensure webhook HMAC key matches
```

**Authentication Issues**
```bash
# Check JWT secret configuration
# Verify user seeding completed
# Check browser localStorage for token persistence
```

### Log Locations
- Application logs: `docker logs adyen-integration-server-prod`
- Database logs: `docker logs adyen-integration-db-prod`
- Frontend logs: `docker logs adyen-integration-ui-prod`

## 📞 Support

For production issues:
1. Check application logs
2. Verify Adyen Customer Area settings
3. Test API endpoints manually
4. Review database connection status
5. Check webhook delivery logs in Adyen
