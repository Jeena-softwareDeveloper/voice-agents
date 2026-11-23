import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Call, TelephonyNumber, TenantVoicePreference, SarvamVoice, SarvamLanguage, AgentConfiguration, ProviderCapabilities } from '@/types';

export interface AiCallingOverviewData {
  tenant: {
    id: string;
    name: string;
    aiCallingEnabled: boolean;
    monthlyCallingLimit: number;
    usedCallingMinutes: number;
    creditBalance: number;
  };
  assignedNumber: TelephonyNumber | null;
  voicePreferences: TenantVoicePreference;
  telemetry: {
    totalCalls: number;
    connectedCalls: number;
    failedCalls: number;
    totalMinutes: number;
  };
  warnings: string[];
  recentCalls: Call[];
}

export interface AiCallOptionsData {
  languages?: SarvamLanguage[];
  voices?: SarvamVoice[];
  defaultProvider: string;
  asrModel?: string;
  ttsModel?: string;
  isConfigured?: boolean;
}

export const aiCallingApi = {
  // Dispatches
  dispatchCall: (leadId: string) => api.post<any>(API_ENDPOINTS.WORKSPACE.AI_CALLING.DISPATCH, { leadId }),
  bulkDispatch: (leadIds: string[]) => api.post<any>(API_ENDPOINTS.WORKSPACE.AI_CALLING.BULK_DISPATCH, { leadIds }),
  
  // Client AI Calling Dashboard & Overview
  getOverview: () => api.get<AiCallingOverviewData>(API_ENDPOINTS.WORKSPACE.AI_CALLING.OVERVIEW),
  getOptions: () => api.get<AiCallOptionsData>(API_ENDPOINTS.WORKSPACE.AI_CALLING.OPTIONS),
  
  // Voice Preferences
  getVoicePreferences: () => api.get<TenantVoicePreference>(API_ENDPOINTS.WORKSPACE.AI_CALLING.VOICE_PREFS),
  updateVoicePreferences: (payload: Partial<TenantVoicePreference>) =>
    api.put<TenantVoicePreference>(API_ENDPOINTS.WORKSPACE.AI_CALLING.VOICE_PREFS, payload),
  previewVoiceSample: (payload: { text: string; voice?: string; language?: string }) =>
    api.post<{ message: string; audioUrl?: string; durationSeconds?: number; characterCount?: number }>(
      API_ENDPOINTS.WORKSPACE.AI_CALLING.PREVIEW_VOICE,
      payload,
    ),

  // Phone Numbers
  getPhoneNumbers: () =>
    api.get<{ assigned: TelephonyNumber | null; available: TelephonyNumber[] }>(
      API_ENDPOINTS.WORKSPACE.AI_CALLING.PHONE_NUMBERS,
    ),
  requestPhoneNumber: (payload: {
    numberId?: string;
    businessKyc: { gstin?: string; panNumber?: string; registeredAddress?: string; authorizedSignatoryName: string };
    isByot?: boolean;
    byotDetails?: { carrierName?: string; sipTrunkHost?: string; accountSid?: string };
  }) => api.post<TelephonyNumber>(API_ENDPOINTS.WORKSPACE.AI_CALLING.REQUEST_NUMBER, payload),
  releasePhoneNumber: (numberId: string) =>
    api.delete<any>(API_ENDPOINTS.WORKSPACE.AI_CALLING.RELEASE_NUMBER(numberId)),

  // Credit Top-Up
  topUpCredits: (amount: number) =>
    api.post<{ success: boolean; newBalance: number; transaction: any }>(
      API_ENDPOINTS.WORKSPACE.AI_CALLING.TOPUP_CREDITS,
      { amount },
    ),

  // Telemetry Calls
  getTenantCalls: (params?: { status?: string; outcome?: string; serviceId?: string }) =>
    api.get<Call[]>(API_ENDPOINTS.WORKSPACE.CALLS.BASE, { params }),
  getCallById: (id: string) => api.get<Call>(API_ENDPOINTS.WORKSPACE.CALLS.DETAIL(id)),
  getAdminCallHistory: (params?: { tenantId?: string; status?: string; outcome?: string }) =>
    api.get<Call[]>(API_ENDPOINTS.ADMIN.CALL_HISTORY, { params }),
  getCallsOverview: () => api.get<any>(API_ENDPOINTS.ADMIN.CALLS_OVERVIEW),

  // Service Knowledge Base & FAQs
  getServiceKnowledgeBase: (serviceId: string) =>
    api.get<any>(API_ENDPOINTS.WORKSPACE.AI_CALLING.KNOWLEDGE_BASE(serviceId)),
  updateServiceKnowledgeBase: (serviceId: string, payload: any) =>
    api.put<any>(API_ENDPOINTS.WORKSPACE.AI_CALLING.KNOWLEDGE_BASE(serviceId), payload),

  // AI Quality Testing Simulator
  simulateTestScenario: (scenario: string, leadId?: string) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.AI_CALLING.SIMULATE_TEST, { scenario, leadId }),

  // Dynamic Organization AI Agent Configuration (Gemini-Powered)
  getProviderCapabilities: () => api.get<ProviderCapabilities>('/ai-calling/provider-capabilities'),
  getAgentConfiguration: () => api.get<AgentConfiguration>('/ai-calling/agent-config'),
  generateAgentConfiguration: (guidance?: string) =>
    api.post<AgentConfiguration>('/ai-calling/agent-config/generate', { guidance }),
  updateAgentConfiguration: (id: string, payload: Partial<AgentConfiguration>) =>
    api.put<AgentConfiguration>(`/ai-calling/agent-config/${id}`, payload),
  approveAgentConfiguration: (id: string) =>
    api.post<AgentConfiguration>(`/ai-calling/agent-config/${id}/approve`, {}),
  getAgentConfigurationHistory: () => api.get<any[]>('/ai-calling/agent-config/history'),

  // AI Voice Agents Real-Time Test Agent Workbench
  getAgentMetadata: (serviceId: string) =>
    api.get<any>(`/ai-calling/test-session/agent-meta/${serviceId}`),
  initiateTestSession: (payload: {
    serviceId: string;
    mode: 'voice' | 'phone' | 'chat';
    version?: string;
    language?: string;
    voice?: string;
    testPhone?: string;
    variables?: Record<string, any>;
  }) => api.post<any>('/ai-calling/test-session/initiate', payload),
  saveTestSession: (sessionData: any) =>
    api.post<any>('/ai-calling/test-session/save', sessionData),
  getTestSessionHistory: (serviceId?: string) =>
    api.get<any[]>('/ai-calling/test-session/history', { params: { serviceId } }),
  dispatchPhoneTest: (payload: { serviceId: string; testPhoneNumber: string; customerName?: string }) =>
    api.post<any>('/ai-calling/test-session/phone-call', payload),
  synthesizeSpeech: (payload: { text: string; language?: string; speaker?: string; model?: string }) =>
    api.post<{ audioBase64: string; speaker: string; model: string }>('/ai-calling/synthesize-speech', payload),
};
