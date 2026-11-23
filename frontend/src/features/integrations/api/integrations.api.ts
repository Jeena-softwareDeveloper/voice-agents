import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import {
  IntegrationItem,
  IntegrationProvider,
  WhatsAppConnectPayload,
  MetaConnectPayload,
  MetaConfigurePayload,
  CalendarConfigurePayload,
} from '../types/integration.types';

export const integrationsApi = {
  // Get all 4 integrations status
  getAll: () => api.get<IntegrationItem[]>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.BASE),

  // Get single integration detail
  getDetail: (provider: IntegrationProvider) =>
    api.get<IntegrationItem>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.DETAIL(provider)),

  // OAuth Authorization
  getOAuthUrl: (provider: IntegrationProvider, redirectUri?: string, clientId?: string) =>
    api.get<{ oauthUrl?: string; state?: string; requiresCredentials?: boolean; message?: string; provider: string }>(
      `${API_ENDPOINTS.WORKSPACE.INTEGRATIONS.OAUTH_URL(provider)}?${new URLSearchParams({
        ...(redirectUri ? { redirectUri } : {}),
        ...(clientId ? { clientId } : {}),
      }).toString()}`,
    ),

  handleOAuthCallback: (provider: IntegrationProvider, code: string, state: string, redirectUri?: string) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.OAUTH_CALLBACK(provider), {
      code,
      state,
      redirectUri,
    }),

  // Google Direct Connect (Gmail & Google Calendar)
  connectGoogle: (payload: {
    provider: IntegrationProvider;
    accessToken?: string;
    refreshToken?: string;
    email?: string;
    name?: string;
    clientId?: string;
    clientSecret?: string;
  }) => api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.GOOGLE_CONNECT, payload),

  // Google Platform OAuth Configuration
  getGooglePlatformConfig: () =>
    api.get<{
      isConfigured: boolean;
      clientId: string | null;
      fullClientId: string | null;
      hasSecret: boolean;
      redirectUri: string;
    }>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.GOOGLE_PLATFORM_CONFIG),

  configureGooglePlatform: (payload: { clientId: string; clientSecret?: string }) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.GOOGLE_PLATFORM_CONFIG, payload),

  // WhatsApp
  connectWhatsApp: (payload: WhatsAppConnectPayload) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.WHATSAPP_CONNECT, payload),

  syncWhatsAppTemplates: () =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.WHATSAPP_SYNC_TEMPLATES, {}),

  // Meta
  connectMeta: (payload: MetaConnectPayload) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.META_CONNECT, payload),

  getMetaAssets: () =>
    api.get<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.META_ASSETS),

  configureMetaAssets: (payload: MetaConfigurePayload) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.META_CONFIGURE, payload),

  // Google Calendar
  getCalendars: () =>
    api.get<{ calendars: any[]; selectedCalendarId: string }>(
      API_ENDPOINTS.WORKSPACE.INTEGRATIONS.CALENDAR_LIST,
    ),

  configureCalendar: (payload: CalendarConfigurePayload) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.CALENDAR_CONFIGURE, payload),

  createMeeting: (payload: {
    title: string;
    startTime: string;
    endTime: string;
    attendeeEmail: string;
    description?: string;
  }) => api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.CALENDAR_MEETING, payload),

  // Gmail
  sendTestEmail: (payload: { to: string; subject: string; bodyContent: string }) =>
    api.post<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.GMAIL_TEST_SEND, payload),

  // Disconnect
  disconnect: (provider: IntegrationProvider) =>
    api.delete<any>(API_ENDPOINTS.WORKSPACE.INTEGRATIONS.DISCONNECT(provider)),
};
