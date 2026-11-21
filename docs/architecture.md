# Multi-Tenant AI CRM Platform - System Architecture & Business Logic

## 1. Executive Overview
The Enterprise AI CRM is a centralized multi-tenant SaaS platform where:
1. **Platform Admin**: Manages tenant accounts, service category approvals, AI prompt configurations, telephony parameters, billing & global settings across 5 strictly scoped menus.
2. **Tenant Client**: Manages leads, service categories, automated AI outbound calling, sales pipelines, follow-ups, converted customers and analytics reports across 8 strictly scoped menus.
3. **Sarvam AI Voice Engine**: Orchestrates conversational outbound voice calling with customizable qualification questions, multilingual support, and real-time call telemetry.

## 2. Core Business Flow
```
[Platform Admin] -> Creates Client Tenant -> Client Activates Account -> Completes Onboarding
       │
       ▼
[Client Workspace] -> Creates Service Categories (e.g., Residential Plots, Apartments)
       │
       ▼
[Platform Admin Review] -> Admin Reviews Service -> Configures & Approves Sarvam AI Conversation
       │
       ▼
[Client Workspace] -> Imports Leads (Single or Multi-Category CSV/Excel) -> Leads Mapped to Services
       │
       ▼
[Automated Calling Queue] -> Validates Consent, Calling Hours, Balance -> Dispatches to Sarvam AI
       │
       ▼
[Sarvam AI Voice Call] -> Conducts Voice Call with Qualification Questions -> Webhook Dispatched
       │
       ▼
[CRM Engine Updates] -> Updates Lead Status -> Creates Follow-up if needed -> Advances Sales Pipeline
       │
       ▼
[Customer Conversion] -> Qualified Leads advance to Won -> Converted to Customer (Linked Contact)
       │
       ▼
[Usage & Billing] -> Call duration recorded in AI Usage Ledger -> Invoiced to Tenant -> Payment Recorded
```

## 3. Database Architecture (Prisma)
- `users`: Core authentication identity with roles (`PLATFORM_ADMIN`, `TENANT_ADMIN`, `TENANT_USER`).
- `tenants`: Client company records with sub-domain/slug and subscription limits.
- `tenant_memberships`: Maps users to tenants with roles and permissions.
- `tenant_invitations`: Secure account activation tokens.
- `tenant_business_profiles`: Onboarding details (industry, operating locations, objectives).
- `subscriptions`: Active subscription tier, AI calling limits, and billing cycles.
- `services`: Client-defined service categories requiring platform approval.
- `ai_conversation_templates`: System AI conversation prompts & configurations.
- `service_ai_configs`: Approved AI conversation bindings specific to a (tenant, service) tuple.
- `contacts`: Single source of truth for person details (phone, email, full name).
- `leads`: Service-specific enquiry belonging to a tenant and referencing a contact.
- `lead_import_batches` & `lead_import_rows`: Batch import tracking, column mapping, validation.
- `calls` & `call_events`: Outbound telephony calls, duration, recording URL, transcript, outcome.
- `follow_ups`: Scheduled action items, callbacks, meeting requests.
- `sales_pipeline_history`: Audit trail for lead stage progressions.
- `customers`: Converted leads tied to the unified contact entity.
- `ai_usage_ledger`: Immutable billable minute consumption per call.
- `invoices` & `payments`: Invoicing, tax calculations, and payment tracking.
- `tenant_calling_settings`: Custom calling windows and retry caps.
- `audit_logs`: Administrative actions tracking.
