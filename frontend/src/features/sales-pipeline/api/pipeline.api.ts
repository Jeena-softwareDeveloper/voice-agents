import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const pipelineApi = {
  getStages: () => api.get<Record<string, any[]>>(API_ENDPOINTS.WORKSPACE.PIPELINE.STAGES),
  moveStage: (leadId: string, newStage: string, reason?: string) =>
    api.put<any>(API_ENDPOINTS.WORKSPACE.PIPELINE.MOVE, { leadId, newStage, reason }),
  getHistory: (leadId: string) => api.get<any[]>(API_ENDPOINTS.WORKSPACE.PIPELINE.HISTORY(leadId)),
};
