import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Service } from '@/types';

export interface CreateServicePayload {
  name: string;
  category: string;
  description: string;
  location?: string;
  pricingInfo?: string;
  additionalInfo?: string;
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {
  isActive?: boolean;
}

export const servicesApi = {
  getTenantServices: () => api.get<Service[]>(API_ENDPOINTS.WORKSPACE.SERVICES.BASE),
  getServiceById: (id: string) => api.get<Service>(API_ENDPOINTS.WORKSPACE.SERVICES.DETAIL(id)),
  createService: (payload: CreateServicePayload) => api.post<Service>(API_ENDPOINTS.WORKSPACE.SERVICES.BASE, payload),
  updateService: (id: string, payload: UpdateServicePayload) =>
    api.put<Service>(API_ENDPOINTS.WORKSPACE.SERVICES.DETAIL(id), payload),
  deleteService: (id: string) =>
    api.delete<{ success: boolean }>(API_ENDPOINTS.WORKSPACE.SERVICES.DETAIL(id)),
  toggleServiceStatus: (id: string, isActive: boolean) =>
    api.put<Service>(API_ENDPOINTS.WORKSPACE.SERVICES.DETAIL(id), { isActive }),
  getAllAdminServices: (params?: { tenantId?: string; status?: string }) =>
    api.get<Service[]>(API_ENDPOINTS.ADMIN.ALL_SERVICES, { params }),
  approveAiConfig: (payload: any) => api.post<any>(API_ENDPOINTS.ADMIN.APPROVE_SERVICE_AI, payload),
  testConversation: (configId: string) => api.post<any>(API_ENDPOINTS.ADMIN.TEST_CONVERSATION(configId)),
  getAiTemplates: () => api.get<any[]>(API_ENDPOINTS.ADMIN.AI_TEMPLATES),
  getAiOptions: () => api.get<{ languages: any[]; voices: any[] }>(API_ENDPOINTS.ADMIN.AI_OPTIONS),
};
