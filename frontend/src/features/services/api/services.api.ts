import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Service } from '@/types';

export interface CreateServicePayload {
  name: string;
  category: string;
  description: string;
  location?: string;
  marketLocation?: string;
  pricingInfo?: string;
  additionalInfo?: string;
  extractedInfo?: any;
  marketingMaterials?: any[];
  aiCallingConfig?: any;
  followUpStages?: any[];
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
  extractMarketingMaterial: (files: any[], serviceContext: any) =>
    api.post<any>('/services/extract-material', { files, serviceContext }),
  generateAiConfig: (serviceContext: any, extractedInfo?: any) =>
    api.post<any>('/services/generate-ai-config', { serviceContext, extractedInfo }),
  generateWorkflowStages: (serviceContext: any, extractedInfo?: any) =>
    api.post<any[]>('/services/generate-workflow-stages', { serviceContext, extractedInfo }),
  approveServiceAiConfig: (serviceId: string) =>
    api.put<Service>(`/services/${serviceId}/approve-config`),
  updateStages: (serviceId: string, stages: any[]) =>
    api.put<any[]>(`/services/${serviceId}/stages`, { stages }),
  getAllAdminServices: (params?: { tenantId?: string; status?: string }) =>
    api.get<Service[]>(API_ENDPOINTS.ADMIN.ALL_SERVICES, { params }),
  approveAiConfig: (payload: any) => api.post<any>(API_ENDPOINTS.ADMIN.APPROVE_SERVICE_AI, payload),
  testConversation: (configId: string) => api.post<any>(API_ENDPOINTS.ADMIN.TEST_CONVERSATION(configId)),
  getAiTemplates: () => api.get<any[]>(API_ENDPOINTS.ADMIN.AI_TEMPLATES),
  getAiOptions: () => api.get<{ languages: any[]; voices: any[] }>(API_ENDPOINTS.ADMIN.AI_OPTIONS),
};
