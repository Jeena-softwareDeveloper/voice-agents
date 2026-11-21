import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const paymentsApi = {
  getPlatformOverview: () => api.get<any>(API_ENDPOINTS.ADMIN.PAYMENTS_OVERVIEW),
  getTenantInvoices: () => api.get<any[]>(API_ENDPOINTS.WORKSPACE.PAYMENTS.INVOICES),
  recordPayment: (payload: { invoiceId: string; amount: number; transactionRef: string; gateway?: string }) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.PAYMENTS.RECORD, payload),
};
