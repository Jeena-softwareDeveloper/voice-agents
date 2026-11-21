import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const reportsApi = {
  getTenantReport: () => api.get<any>(API_ENDPOINTS.WORKSPACE.REPORTS),
};
