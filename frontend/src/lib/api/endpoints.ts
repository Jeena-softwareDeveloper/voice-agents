export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    ACTIVATE: '/auth/activate-account',
    PROFILE: '/auth/profile',
  },
  // Platform Admin
  ADMIN: {
    DASHBOARD: '/platform-admin/dashboard',
    CALLS_OVERVIEW: '/platform-admin/calls/overview',
    ALL_LEADS: '/platform-admin/calls/leads',
    ALL_SERVICES: '/platform-admin/calls/services',
    CALL_HISTORY: '/platform-admin/calls/history',
    AI_TEMPLATES: '/platform-admin/ai-conversations/templates',
    APPROVE_SERVICE_AI: '/platform-admin/services/approve-ai-config',
    TEST_CONVERSATION: (id: string) => `/platform-admin/services/test-conversation/${id}`,
    AI_OPTIONS: '/platform-admin/ai-options',
    PAYMENTS_OVERVIEW: '/platform-admin/payments/overview',
    SETTINGS: '/platform-admin/settings',
  },
  // Tenants (Platform Admin control)
  TENANTS: {
    BASE: '/tenants',
    DETAIL: (id: string) => `/tenants/${id}`,
    UPDATE_STATUS: (id: string) => `/tenants/${id}/status`,
  },
  // Client Workspace
  WORKSPACE: {
    ONBOARDING: '/business-onboarding/status',
    SAVE_ONBOARDING: '/business-onboarding/save',
    SERVICES: {
      BASE: '/services',
      DETAIL: (id: string) => `/services/${id}`,
    },
    LEADS: {
      BASE: '/leads',
      DETAIL: (id: string) => `/leads/${id}`,
    },
    IMPORTS: {
      UPLOAD: '/imports/leads',
      BATCHES: '/imports/batches',
    },
    AI_CALLING: {
      DISPATCH: '/ai-calling/dispatch',
      BULK_DISPATCH: '/ai-calling/bulk-dispatch',
    },
    CALLS: {
      BASE: '/calls',
      DETAIL: (id: string) => `/calls/${id}`,
    },
    PIPELINE: {
      STAGES: '/sales-pipeline/stages',
      MOVE: '/sales-pipeline/move-stage',
      HISTORY: (leadId: string) => `/sales-pipeline/${leadId}/history`,
    },
    FOLLOW_UPS: {
      BASE: '/follow-ups',
      DETAIL: (id: string) => `/follow-ups/${id}`,
    },
    CUSTOMERS: {
      BASE: '/customers',
      DETAIL: (id: string) => `/customers/${id}`,
      CONVERT: '/customers/convert',
    },
    REPORTS: '/reports',
    PAYMENTS: {
      INVOICES: '/payments/invoices',
      RECORD: '/payments/record',
    },
    SETTINGS: {
      CALLING: '/settings/calling',
    },
  },
};
