import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Customer } from '@/types';

export const customersApi = {
  getCustomers: () => api.get<Customer[]>(API_ENDPOINTS.WORKSPACE.CUSTOMERS.BASE),
  getCustomerById: (id: string) => api.get<Customer>(API_ENDPOINTS.WORKSPACE.CUSTOMERS.DETAIL(id)),
  convertLead: (leadId: string, contractValue?: number, notes?: string) =>
    api.post<Customer>(API_ENDPOINTS.WORKSPACE.CUSTOMERS.CONVERT, { leadId, contractValue, notes }),
};
