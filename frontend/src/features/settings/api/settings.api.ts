import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const settingsApi = {
  getPlatformSettings: () => api.get<any>(API_ENDPOINTS.ADMIN.SETTINGS),
  updatePlatformSettings: (payload: any) => api.put<any>(API_ENDPOINTS.ADMIN.SETTINGS, payload),
  getTenantCallingSettings: () => api.get<any>(API_ENDPOINTS.WORKSPACE.SETTINGS.CALLING),
  updateTenantCallingSettings: (payload: any) => api.put<any>(API_ENDPOINTS.WORKSPACE.SETTINGS.CALLING, payload),
};
