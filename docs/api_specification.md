# API Specification - Multi-Tenant AI CRM Platform

## Base URL
`/api`

## Authentication
JWT Bearer token required in `Authorization: Bearer <token>` header for all protected endpoints.
Tenant identifier required in `x-tenant-id: <tenant_uuid>` header for workspace requests.

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ accessToken, user, tenant }`

### `POST /api/auth/activate-account`
- **Body**: `{ token, newPassword }`
- **Response**: `{ success, message }`

### `GET /api/auth/profile`
- **Response**: Detailed user and active membership profile.

---

## 2. Platform Admin Endpoints (Role: `PLATFORM_ADMIN`)

### `GET /api/platform-admin/dashboard`
- Aggregates platform KPIs (total clients, leads, calls, connected, failed, billable minutes, revenue, pending).

### `GET /api/platform-admin/calls/leads`
- Search and filter all leads across tenants.

### `GET /api/platform-admin/calls/services`
- Lists client service categories for AI approval.

### `POST /api/platform-admin/services/approve-ai-config`
- **Body**: Service AI prompt, qualification questions, voice, language, objection handling.

### `POST /api/platform-admin/services/test-conversation/:configId`
- Simulates an AI call dialogue with Sarvam AI test harness.

### `GET /api/platform-admin/payments/overview`
- Financial ledger, total revenue, calling charges, invoices.

### `GET /api/platform-admin/settings` & `PUT /api/platform-admin/settings`
- Sarvam AI API keys, telephony inventory, calling hours, concurrency limits.

---

## 3. Client Workspace Endpoints (Role: `TENANT_ADMIN`, `TENANT_STAFF`)

### `GET /api/services` & `POST /api/services`
- Manage service categories (e.g., Residential Plots, Apartments).

### `GET /api/leads` & `POST /api/leads`
- Retrieve and manually create leads mapped to services and contacts.

### `POST /api/imports/leads`
- Multi-part form-data with CSV or Excel spreadsheet. Validates duplicates, phone format, and auto-maps service categories.

### `POST /api/ai-calling/dispatch`
- Validates consent, calling hours, minute balance, and initiates outbound Sarvam AI call.

### `GET /api/calls` & `GET /api/calls/:id`
- Full call telemetry, transcripts, duration, recording URL, and summaries.

### `GET /api/sales-pipeline/stages` & `PUT /api/sales-pipeline/move-stage`
- Kanban stage transitions and historical audit logs.

### `GET /api/follow-ups` & `POST /api/follow-ups` & `PUT /api/follow-ups/:id`
- Customer callbacks, demo requests, and scheduled visits.

### `POST /api/customers/convert` & `GET /api/customers`
- Conversion of won leads to unified customer records without contact duplication.

### `GET /api/reports`
- Tenant-isolated service-wise performance and call conversion analytics.
