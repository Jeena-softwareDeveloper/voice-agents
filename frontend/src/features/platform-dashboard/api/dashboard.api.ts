import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const platformDashboardApi = {
  getDashboard: () => api.get<any>(API_ENDPOINTS.ADMIN.DASHBOARD),
};
