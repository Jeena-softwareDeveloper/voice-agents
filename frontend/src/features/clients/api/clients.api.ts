import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Tenant } from '@/types';

export interface CreateClientPayload {
  companyName: string;
  businessEmail: string;
  contactNumber: string;
  businessType: string;
  country?: string;
  state: string;
  city: string;
  adminName: string;
  adminEmail: string;
  adminMobile?: string;
  subscriptionPlan?: string;
  monthlyCallingLimit?: number;
  initialCredits?: number;
}

export const clientsApi = {
  getAll: () => api.get<Tenant[]>(API_ENDPOINTS.TENANTS.BASE),
  getById: (id: string) => api.get<Tenant>(API_ENDPOINTS.TENANTS.DETAIL(id)),
  create: (payload: CreateClientPayload) => api.post<any>(API_ENDPOINTS.TENANTS.BASE, payload),
  updateStatus: (id: string, status: string, aiCallingEnabled?: boolean, monthlyCallingLimit?: number) =>
    api.put<any>(API_ENDPOINTS.TENANTS.UPDATE_STATUS(id), { status, aiCallingEnabled, monthlyCallingLimit }),
};
