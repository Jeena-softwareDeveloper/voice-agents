# Multi-Tenant AI CRM Platform

Enterprise-grade AI-powered CRM SaaS platform with centralized administration, isolated tenant client workspaces, and native Sarvam AI voice telephony integration.

## Architecture

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, NestJS, TypeScript, Prisma ORM
- **Database**: PostgreSQL (multi-tenant with tenant context isolation)
- **AI Telephony**: Sarvam AI conversational voice agent integration
- **Infrastructure**: Docker Compose for PostgreSQL & Redis

## Directory Structure

```text
├── frontend/             # Next.js App Router frontend
│   ├── src/
│   │   ├── app/          # (auth), (platform-admin), (client) route groups
│   │   ├── features/     # Isolated feature modules with API, hooks, schemas
│   │   ├── components/   # Common atomic UI and layout sidebars/headers
│   │   └── lib/          # Centralized API client and interceptors
├── backend/              # NestJS centralized backend
│   ├── prisma/           # PostgreSQL schema, seeds, migrations
│   └── src/              # Controllers, services, integrations, tenancy
├── infrastructure/       # Docker compose, database configs, scripts
└── docs/                 # Architecture, API specifications, and business flows
```

## Quick Start

### 1. Infrastructure (PostgreSQL)
```bash
cd infrastructure
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push # or npx prisma migrate dev
npm run seed
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Platform Admin: `http://localhost:3000/admin/dashboard`
Client Workspace: `http://localhost:3000/workspace/dashboard`
