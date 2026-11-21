import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Lead } from '@/types';

export interface CreateLeadPayload {
  name: string;
  phone: string;
  email?: string;
  location?: string;
  serviceId: string;
  leadSource?: string;
  notes?: string;
  callingConsent?: boolean;
}

export const leadsApi = {
  getTenantLeads: (params?: { serviceId?: string; status?: string; search?: string }) =>
    api.get<Lead[]>(API_ENDPOINTS.WORKSPACE.LEADS.BASE, { params }),
  getLeadById: (id: string) => api.get<Lead>(API_ENDPOINTS.WORKSPACE.LEADS.DETAIL(id)),
  createLead: (payload: CreateLeadPayload) => api.post<Lead>(API_ENDPOINTS.WORKSPACE.LEADS.BASE, payload),
  updateLead: (id: string, payload: any) => api.put<Lead>(API_ENDPOINTS.WORKSPACE.LEADS.DETAIL(id), payload),
  getAllAdminLeads: (params?: { tenantId?: string; serviceCategory?: string; search?: string }) =>
    api.get<Lead[]>(API_ENDPOINTS.ADMIN.ALL_LEADS, { params }),
  importLeads: (formData: FormData) => api.post<any>(API_ENDPOINTS.WORKSPACE.IMPORTS.UPLOAD, formData),
  getImportBatches: () => api.get<any[]>(API_ENDPOINTS.WORKSPACE.IMPORTS.BATCHES),
};
