import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { TelephonyNumber, SarvamProviderHealth, SarvamApiAuditLog } from '@/types';

export const settingsApi = {
  getPlatformSettings: () => api.get<any>(API_ENDPOINTS.ADMIN.SETTINGS),
  updatePlatformSettings: (payload: any) => api.put<any>(API_ENDPOINTS.ADMIN.SETTINGS, payload),
  
  // Sarvam Provider Central Control
  testSarvamConnection: () => api.post<SarvamProviderHealth>(API_ENDPOINTS.ADMIN.SARVAM_TEST),
  getSarvamMetrics: () => api.get<any>(API_ENDPOINTS.ADMIN.SARVAM_METRICS),
  getSarvamLogs: () => api.get<SarvamApiAuditLog[]>(API_ENDPOINTS.ADMIN.SARVAM_LOGS),

  // Platform Telephony Numbers
  getAllTelephonyNumbers: () => api.get<TelephonyNumber[]>(API_ENDPOINTS.ADMIN.TELEPHONY_NUMBERS),
  addTelephonyNumber: (payload: { number: string; region: string; type: 'DID_LOCAL' | 'TOLL_FREE' | 'MOBILE_VIRTUAL'; monthlyRent: number }) =>
    api.post<TelephonyNumber>(API_ENDPOINTS.ADMIN.TELEPHONY_NUMBERS, payload),
  allocateNumber: (numberId: string, tenantId: string) =>
    api.post<TelephonyNumber>(API_ENDPOINTS.ADMIN.TELEPHONY_ALLOCATE, { numberId, tenantId }),
  releaseNumber: (numberId: string) =>
    api.post<TelephonyNumber>(API_ENDPOINTS.ADMIN.TELEPHONY_RELEASE, { numberId }),

  // Client Quota & Credits Allocation
  updateClientAiQuota: (
    tenantId: string,
    payload: {
      aiCallingEnabled?: boolean;
      monthlyCallingLimit?: number;
      dailyCallingLimit?: number;
      concurrencyLimit?: number;
      creditAdjustment?: number;
      assignedNumberId?: string;
    },
  ) => api.put<any>(API_ENDPOINTS.ADMIN.UPDATE_AI_QUOTA(tenantId), payload),

  // Central Billing & Margin Reports
  getSarvamBillingReport: () => api.get<any>(API_ENDPOINTS.ADMIN.SARVAM_BILLING_REPORT),

  // Tenant calling settings
  getTenantCallingSettings: () => api.get<any>(API_ENDPOINTS.WORKSPACE.SETTINGS.CALLING),
  updateTenantCallingSettings: (payload: any) => api.put<any>(API_ENDPOINTS.WORKSPACE.SETTINGS.CALLING, payload),

  // Tenant Company Profile
  getCompanyProfile: () => api.get<any>(API_ENDPOINTS.WORKSPACE.SETTINGS.COMPANY),
  updateCompanyProfile: (payload: {
    companyName: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    businessType?: string;
  }) => api.put<any>(API_ENDPOINTS.WORKSPACE.SETTINGS.COMPANY, payload),
};
