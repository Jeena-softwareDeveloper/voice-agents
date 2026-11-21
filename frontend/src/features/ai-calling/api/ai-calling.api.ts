import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Call } from '@/types';

export const aiCallingApi = {
  dispatchCall: (leadId: string) => api.post<any>(API_ENDPOINTS.WORKSPACE.AI_CALLING.DISPATCH, { leadId }),
  bulkDispatch: (leadIds: string[]) => api.post<any>(API_ENDPOINTS.WORKSPACE.AI_CALLING.BULK_DISPATCH, { leadIds }),
  getTenantCalls: (params?: { status?: string; outcome?: string; serviceId?: string }) =>
    api.get<Call[]>(API_ENDPOINTS.WORKSPACE.CALLS.BASE, { params }),
  getCallById: (id: string) => api.get<Call>(API_ENDPOINTS.WORKSPACE.CALLS.DETAIL(id)),
  getAdminCallHistory: (params?: { tenantId?: string; status?: string; outcome?: string }) =>
    api.get<Call[]>(API_ENDPOINTS.ADMIN.CALL_HISTORY, { params }),
  getCallsOverview: () => api.get<any>(API_ENDPOINTS.ADMIN.CALLS_OVERVIEW),
};
