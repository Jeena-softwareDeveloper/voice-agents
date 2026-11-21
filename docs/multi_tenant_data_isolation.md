# Multi-Tenant Data Isolation & Security Architecture

## 1. Tenancy Model
The platform employs a pooled database with discriminator column (`tenantId`) architecture, reinforced by:
1. **Tenant Context Asynchronous Local Storage (`TenantContext`)**: Tracks authenticated tenant context per async execution context.
2. **Tenant Resolver Middleware**: Intercepts requests, validates JWT claims, and enforces `x-tenant-id` matching.
3. **Tenant Guard (`TenantGuard`)**: Enforces active account checks and validates that non-admin users belong strictly to the claimed tenant.
4. **Foreign Key Integrity**: Every tenant-owned record (`services`, `leads`, `calls`, `contacts`, `customers`, `invoices`, `follow_ups`) maintains a non-nullable foreign key referencing `tenants(id)`.

## 2. Single Source of Truth for Contacts
To eliminate redundant customer records:
- The `contacts` table maintains unique `(tenantId, phone)` records with consent audit trails.
- Leads (`leads`) represent specific service enquiries and reference `contactId` + `serviceId`.
- Customers (`customers`) reference `contactId` upon lead conversion.
- Cross-tenant data leaks are structurally prevented at the database and application layers.
