# Production Deployment Guide - Multi-Tenant AI CRM Platform

## Prerequisites
- Node.js v20+ or v22+
- PostgreSQL 15+ or 16+
- Redis (Optional, for asynchronous job queues)
- Docker & Docker Compose (Optional)

---

## 1. Environment Configurations

### Backend (`backend/.env`)
```ini
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/acrm_db?schema=public"
JWT_SECRET="<generate_secure_random_key_64_chars>"
JWT_EXPIRATION="7d"
SARVAM_API_KEY="<your_live_sarvam_api_key>"
SARVAM_API_BASE_URL="https://api.sarvam.ai/v1"
TELEPHONY_WEBHOOK_SECRET="<telephony_webhook_hmac_secret>"
FRONTEND_URL="https://app.yourcrm.com"
APP_ENV="production"
```

### Frontend (`frontend/.env.production`)
```ini
NEXT_PUBLIC_API_URL="https://api.yourcrm.com/api"
```

---

## 2. Database Migration & Seeding
```bash
cd backend
npm install
npx prisma generate
npx prisma db push # Or npx prisma migrate deploy
npm run seed
```

---

## 3. Production Build & Launch

### Backend
```bash
cd backend
npm run build
node dist/src/main.js
```

### Frontend
```bash
cd frontend
npm run build
npm run start
```
