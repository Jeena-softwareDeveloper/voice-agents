import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { FollowUp } from '@/types';

export const followUpsApi = {
  getFollowUps: (filter?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all') =>
    api.get<FollowUp[]>(API_ENDPOINTS.WORKSPACE.FOLLOW_UPS.BASE, { params: { filter } }),
  createFollowUp: (payload: any) => api.post<FollowUp>(API_ENDPOINTS.WORKSPACE.FOLLOW_UPS.BASE, payload),
  updateFollowUp: (id: string, payload: any) =>
    api.put<FollowUp>(API_ENDPOINTS.WORKSPACE.FOLLOW_UPS.DETAIL(id), payload),
};
