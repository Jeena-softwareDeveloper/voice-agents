export type IntegrationProvider = 'WHATSAPP' | 'FACEBOOK_META' | 'GMAIL' | 'GOOGLE_CALENDAR';

export type IntegrationStatus = 'CONNECTED' | 'NOT_CONNECTED' | 'ERROR' | 'EXPIRED';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components?: any[];
}

export interface MetaPage {
  id: string;
  name: string;
  category?: string;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  accountId: string;
}

export interface MetaLeadForm {
  id: string;
  name: string;
  status: string;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary: boolean;
  timeZone?: string;
}

export interface IntegrationItem {
  id?: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  accountIdentifier: string | null;
  accountName: string | null;
  metadata: any | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  connectedAt?: string | null;
}

export interface WhatsAppConnectPayload {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
}

export interface MetaConnectPayload {
  accessToken: string;
  appId?: string;
  appSecret?: string;
}

export interface MetaConfigurePayload {
  pageId?: string;
  pageName?: string;
  adAccountId?: string;
  adAccountName?: string;
  leadFormIds?: string[];
}

export interface CalendarConfigurePayload {
  calendarId: string;
  calendarSummary?: string;
  timeZone?: string;
}
