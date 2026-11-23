'use client';

import React, { useState, useEffect } from 'react';
import { integrationsApi } from '../api/integrations.api';
import {
  IntegrationItem,
  IntegrationProvider,
  IntegrationStatus,
} from '../types/integration.types';
import { Button } from '@/components/common/buttons/Button';
import { Modal } from '@/components/common/modals/Modal';
import { Input } from '@/components/common/inputs/Input';
import { Spinner } from '@/components/common/loaders/Spinner';
import { useToast } from '@/components/common/feedback/Toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Trash2,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileText,
  Mail,
  Video,
} from 'lucide-react';

// ============================================================================
// Official Platform SVG Icons
// ============================================================================

export const WhatsAppIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="24" fill="#25D366" />
    <path
      d="M34.5 13.5C31.7 10.7 28 9.2 24 9.2C15.8 9.2 9.2 15.8 9.2 24C9.2 26.6 9.9 29.2 11.2 31.4L9 39.5L17.3 37.3C19.4 38.4 21.7 39 24 39C32.2 39 38.8 32.4 38.8 24.2C38.8 20.2 37.2 16.5 34.5 13.5ZM24 36.5C21.9 36.5 19.8 35.9 18 34.8L17.4 34.4L12.5 35.7L13.8 30.9L13.4 30.3C12.2 28.4 11.5 26.2 11.5 24C11.5 17.1 17.1 11.5 24 11.5C27.3 11.5 30.4 12.8 32.7 15.1C35 17.4 36.3 20.5 36.3 23.8C36.3 30.8 30.7 36.5 24 36.5ZM30.8 26.9C30.4 26.7 28.5 25.8 28.1 25.7C27.7 25.5 27.4 25.5 27.1 25.9C26.8 26.3 26 27.3 25.7 27.6C25.4 27.9 25.2 28 24.8 27.8C24.4 27.6 23.1 27.2 21.6 25.8C20.4 24.7 19.6 23.4 19.4 23C19.2 22.6 19.4 22.4 19.6 22.2C19.8 22 20 21.7 20.2 21.5C20.4 21.3 20.5 21.1 20.6 20.9C20.7 20.7 20.7 20.5 20.6 20.3C20.5 20.1 19.7 18.2 19.4 17.4C19.1 16.6 18.8 16.7 18.5 16.7C18.3 16.7 18 16.7 17.7 16.7C17.4 16.7 17 16.8 16.6 17.2C16.2 17.6 15.2 18.6 15.2 20.6C15.2 22.6 16.7 24.5 16.9 24.8C17.1 25.1 19.8 29.2 23.9 31C24.9 31.4 25.7 31.7 26.3 31.9C27.3 32.2 28.2 32.2 28.9 32.1C29.7 32 31.3 31.1 31.7 30C32.1 28.9 32.1 28 31.9 27.8C31.7 27.5 31.2 27.3 30.8 26.9Z"
      fill="white"
    />
  </svg>
);

export const MetaIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="24" fill="#0081FB" />
    <path
      d="M34.9 20.8C34.3 16.5 31.2 14 26.8 14C23.5 14 21.2 15.6 19.7 18.2C18.6 16 16.5 14 13.5 14C9.5 14 6.5 17 6.5 21.4C6.5 27 12 32.3 19.2 33.7C19.7 33.8 20.3 33.8 20.8 33.7C28 32.3 33.5 27 34.9 20.8ZM19.5 29.9C14.7 28.8 10.3 24.8 10.3 21.3C10.3 18.9 11.9 17.3 14 17.3C16.8 17.3 18.8 20.6 19.5 23.3V29.9ZM22.5 29.9V23.4C23.2 20.7 25.2 17.4 28 17.4C30.1 17.4 31.7 19 31.7 21.4C31.7 24.9 27.3 28.8 22.5 29.9Z"
      fill="white"
    />
  </svg>
);

export const GmailIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48">
    <rect width="48" height="48" rx="24" fill="#F8FAFC" />
    <path
      d="M36 17.2V32C36 33.1 35.1 34 34 34H31V23.5L24 28.8L17 23.5V34H14C12.9 34 12 33.1 12 32V17.2C12 15.7 13.7 14.8 14.9 15.7L24 22.5L33.1 15.7C34.3 14.8 36 15.7 36 17.2Z"
      fill="#EA4335"
    />
    <path d="M12 17.2V32C12 33.1 12.9 34 14 34H17V23.5L12 19.7V17.2Z" fill="#4285F4" />
    <path d="M36 17.2V32C36 33.1 35.1 34 34 34H31V23.5L36 19.7V17.2Z" fill="#34A853" />
    <path
      d="M33.1 15.7L24 22.5L14.9 15.7C13.7 14.8 12 15.7 12 17.2V19.7L24 28.8L36 19.7V17.2C36 15.7 34.3 14.8 33.1 15.7Z"
      fill="#FBBC04"
    />
  </svg>
);

export const GoogleCalendarIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48">
    <rect width="48" height="48" rx="24" fill="#F8FAFC" />
    <rect x="12" y="12" width="24" height="24" rx="4" fill="#4285F4" />
    <path d="M12 18H36V16C36 13.8 34.2 12 32 12H16C13.8 12 12 13.8 12 16V18Z" fill="#1967D2" />
    <text
      x="24"
      y="29"
      fill="white"
      fontSize="12"
      fontFamily="sans-serif"
      fontWeight="bold"
      textAnchor="middle"
    >
      31
    </text>
  </svg>
);

// ============================================================================
// Main Integrations Dashboard Component
// ============================================================================

export const IntegrationsDashboard: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [activeModal, setActiveModal] = useState<IntegrationProvider | null>(null);

  // WhatsApp Modal Form State
  const [waForm, setWaForm] = useState({
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
  });
  const [isConnectingWa, setIsConnectingWa] = useState(false);
  const [isSyncingWaTemplates, setIsSyncingWaTemplates] = useState(false);

  // Meta Modal Form State
  const [metaForm, setMetaForm] = useState({
    accessToken: '',
  });
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [metaAssets, setMetaAssets] = useState<{
    pages: any[];
    adAccounts: any[];
    leadForms: any[];
  } | null>(null);
  const [isLoadingMetaAssets, setIsLoadingMetaAssets] = useState(false);
  const [selectedMetaConfig, setSelectedMetaConfig] = useState({
    pageId: '',
    adAccountId: '',
    leadFormIds: [] as string[],
  });
  const [isSavingMetaConfig, setIsSavingMetaConfig] = useState(false);

  // Gmail Test Send State
  const [testEmailForm, setTestEmailForm] = useState({
    to: '',
    subject: 'Jeenora AI CRM - Test Integration Email',
    bodyContent: 'Hello,\n\nThis is a verified test email sent via authorized Google Gmail integration on Jeenora Multi-Tenant Enterprise AI CRM.',
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Google Calendar State
  const [calendarsList, setCalendarsList] = useState<any[]>([]);
  const [selectedCalId, setSelectedCalId] = useState('primary');
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);
  const [testMeetingForm, setTestMeetingForm] = useState({
    title: 'Customer AI Discovery Meeting',
    attendeeEmail: '',
    startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 24 * 3600 * 1000 + 30 * 60 * 1000).toISOString().slice(0, 16),
  });
  const [isBookingMeeting, setIsBookingMeeting] = useState(false);

  // Google Direct Connect Form State (Gmail & Google Calendar)
  const [googleForm, setGoogleForm] = useState({
    email: '',
    accessToken: '',
    refreshToken: '',
    clientId: '',
  });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Platform Google Cloud OAuth Config State
  const [googleConfig, setGoogleConfig] = useState<{
    isConfigured: boolean;
    clientId: string | null;
    fullClientId: string | null;
    hasSecret: boolean;
    redirectUri: string;
  } | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ clientId: '', clientSecret: '' });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [hasCopiedUri, setHasCopiedUri] = useState(false);

  // Disconnecting State
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

  // Load Integrations on Mount
  useEffect(() => {
    loadAll();
  }, []);

  // Handle incoming OAuth callback query params if present in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      handleOAuthReturn(code, state);
    }
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [data, gConfig] = await Promise.all([
        integrationsApi.getAll(),
        integrationsApi.getGooglePlatformConfig().catch(() => null),
      ]);
      setIntegrations(data);
      if (gConfig) {
        setGoogleConfig(gConfig);
      }
    } catch (err: any) {
      toastError('Failed to load integrations', handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGoogleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm.clientId.trim()) {
      toastError('Validation Error', 'Google Client ID is required');
      return;
    }

    setIsSavingConfig(true);
    try {
      await integrationsApi.configureGooglePlatform({
        clientId: configForm.clientId.trim(),
        clientSecret: configForm.clientSecret.trim() || undefined,
      });
      success('Google OAuth Active', 'Credentials saved. 1-Click Sign-in with Google is now enabled.');
      setIsConfigModalOpen(false);
      const updated = await integrationsApi.getGooglePlatformConfig();
      setGoogleConfig(updated);
    } catch (err: any) {
      toastError('Configuration Failed', handleApiError(err));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleOAuthReturn = async (code: string, state: string) => {
    try {
      // Determine provider from state or decode base64
      let provider: IntegrationProvider = 'GMAIL';
      try {
        const decoded = JSON.parse(atob(state.split('.')[0]));
        provider = decoded.provider;
      } catch {
        // fallback
      }

      info('Processing OAuth Authorization', 'Validating signed tokens with provider...');
      await integrationsApi.handleOAuthCallback(provider, code, state);
      success('Connected Successfully', `${provider} is now active and authenticated.`);

      // Clean query parameters from URL
      window.history.replaceState({}, '', window.location.pathname + '?tab=integrations');
      await loadAll();
    } catch (err: any) {
      toastError('OAuth Failed', handleApiError(err));
    }
  };

  const getIntegration = (provider: IntegrationProvider): IntegrationItem => {
    return (
      integrations.find((i) => i.provider === provider) || {
        provider,
        status: 'NOT_CONNECTED',
        accountIdentifier: null,
        accountName: null,
        metadata: null,
        lastSyncAt: null,
        errorMessage: null,
      }
    );
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Disconnect Handler
  const handleDisconnect = async (provider: IntegrationProvider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}? Stored credentials and webhook listeners will be revoked.`)) {
      return;
    }

    setIsDisconnecting(provider);
    try {
      await integrationsApi.disconnect(provider);
      success('Integration Disconnected', `${provider} credentials safely removed.`);
      setActiveModal(null);
      await loadAll();
    } catch (err: any) {
      toastError('Disconnect Failed', handleApiError(err));
    } finally {
      setIsDisconnecting(null);
    }
  };

  // WhatsApp Connect
  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waForm.wabaId.trim() || !waForm.phoneNumberId.trim() || !waForm.accessToken.trim()) {
      toastError('Validation Error', 'WABA ID, Phone Number ID and Access Token are required.');
      return;
    }

    setIsConnectingWa(true);
    try {
      const res = await integrationsApi.connectWhatsApp({
        wabaId: waForm.wabaId.trim(),
        phoneNumberId: waForm.phoneNumberId.trim(),
        accessToken: waForm.accessToken.trim(),
      });
      success(
        'WhatsApp Business Connected',
        `Linked ${res.verifiedName || 'Account'} (${res.phoneNumber}). Verified ${res.templatesCount} approved templates.`,
      );
      setWaForm({ wabaId: '', phoneNumberId: '', accessToken: '' });
      await loadAll();
    } catch (err: any) {
      toastError('Connection Failed', handleApiError(err));
    } finally {
      setIsConnectingWa(false);
    }
  };

  // WhatsApp Sync Templates
  const handleSyncTemplates = async () => {
    setIsSyncingWaTemplates(true);
    try {
      const res = await integrationsApi.syncWhatsAppTemplates();
      success('Templates Synced', `Updated ${res.templatesCount} approved message templates.`);
      await loadAll();
    } catch (err: any) {
      toastError('Sync Failed', handleApiError(err));
    } finally {
      setIsSyncingWaTemplates(false);
    }
  };

  // Meta Connect
  const handleConnectMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaForm.accessToken.trim()) {
      toastError('Validation Error', 'Meta Access Token is required.');
      return;
    }

    setIsConnectingMeta(true);
    try {
      const res = await integrationsApi.connectMeta({
        accessToken: metaForm.accessToken.trim(),
      });
      success('Meta Ads Connected', `Authenticated as ${res.accountName}.`);
      setMetaForm({ accessToken: '' });
      await loadAll();
    } catch (err: any) {
      toastError('Connection Failed', handleApiError(err));
    } finally {
      setIsConnectingMeta(false);
    }
  };

  // Meta Load Assets
  const handleOpenMetaManage = async () => {
    setActiveModal('FACEBOOK_META');
    setIsLoadingMetaAssets(true);
    try {
      const assets = await integrationsApi.getMetaAssets();
      setMetaAssets(assets);
      setSelectedMetaConfig({
        pageId: assets.selectedPageId || assets.pages[0]?.id || '',
        adAccountId: assets.selectedAdAccountId || assets.adAccounts[0]?.id || '',
        leadFormIds: assets.selectedLeadFormIds || [],
      });
    } catch (err: any) {
      toastError('Failed to load Meta assets', handleApiError(err));
    } finally {
      setIsLoadingMetaAssets(false);
    }
  };

  // Meta Save Configuration
  const handleSaveMetaConfig = async () => {
    setIsSavingMetaConfig(true);
    try {
      await integrationsApi.configureMetaAssets({
        pageId: selectedMetaConfig.pageId,
        adAccountId: selectedMetaConfig.adAccountId,
        leadFormIds: selectedMetaConfig.leadFormIds,
      });
      success('Configuration Saved', 'Selected Facebook Page, Ad Account, and Lead Forms updated.');
      await loadAll();
    } catch (err: any) {
      toastError('Save Failed', handleApiError(err));
    } finally {
      setIsSavingMetaConfig(false);
    }
  };

  // Google OAuth Launch (for Gmail or Google Calendar)
  const handleLaunchGoogleOAuth = async (provider: 'GMAIL' | 'GOOGLE_CALENDAR') => {
    try {
      info('Initiating Google OAuth', 'Generating secure signed authorization request...');
      const res = await integrationsApi.getOAuthUrl(provider);

      if (res.oauthUrl) {
        window.location.href = res.oauthUrl;
      } else if (res.requiresCredentials) {
        toastError('Platform OAuth Not Set', res.message || 'Please configure GOOGLE_CLIENT_ID on the platform.');
      }
    } catch (err: any) {
      toastError('OAuth Launch Failed', handleApiError(err));
    }
  };

  // Google Direct Connect Handler (Gmail & Google Calendar)
  const handleConnectGoogle = async (e: React.FormEvent, provider: 'GMAIL' | 'GOOGLE_CALENDAR') => {
    e.preventDefault();
    if (!googleForm.email.trim() && !googleForm.accessToken.trim()) {
      toastError('Validation Error', 'Either Google Account Email or Access Token is required.');
      return;
    }

    setIsConnectingGoogle(true);
    try {
      const res = await integrationsApi.connectGoogle({
        provider,
        email: googleForm.email.trim(),
        accessToken: googleForm.accessToken.trim() || undefined,
        refreshToken: googleForm.refreshToken.trim() || undefined,
        clientId: googleForm.clientId.trim() || undefined,
      });
      success(
        `${provider === 'GMAIL' ? 'Gmail' : 'Google Calendar'} Connected`,
        `Successfully linked ${res.accountName || res.accountIdentifier || googleForm.email}.`,
      );
      setGoogleForm({ email: '', accessToken: '', refreshToken: '', clientId: '' });
      await loadAll();
    } catch (err: any) {
      toastError('Connection Failed', handleApiError(err));
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Gmail Test Send
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailForm.to.trim()) {
      toastError('Validation Error', 'Recipient email address is required.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await integrationsApi.sendTestEmail({
        to: testEmailForm.to.trim(),
        subject: testEmailForm.subject.trim(),
        bodyContent: testEmailForm.bodyContent.trim(),
      });
      success('Email Dispatched', `Test message delivered to ${res.sentTo} via Gmail API.`);
      await loadAll();
    } catch (err: any) {
      toastError('Email Send Failed', handleApiError(err));
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Google Calendar Manage
  const handleOpenCalendarManage = async () => {
    setActiveModal('GOOGLE_CALENDAR');
    setIsLoadingCalendars(true);
    try {
      const res = await integrationsApi.getCalendars();
      setCalendarsList(res.calendars || []);
      setSelectedCalId(res.selectedCalendarId || 'primary');
    } catch (err: any) {
      toastError('Failed to load calendars', handleApiError(err));
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // Google Calendar Save Selection
  const handleSaveCalendarConfig = async () => {
    setIsSavingCalendar(true);
    try {
      const selectedObj = calendarsList.find((c) => c.id === selectedCalId);
      await integrationsApi.configureCalendar({
        calendarId: selectedCalId,
        calendarSummary: selectedObj?.summary || selectedCalId,
        timeZone: selectedObj?.timeZone,
      });
      success('Calendar Configured', 'Meetings will now automatically schedule onto this calendar.');
      await loadAll();
    } catch (err: any) {
      toastError('Save Failed', handleApiError(err));
    } finally {
      setIsSavingCalendar(false);
    }
  };

  // Google Calendar Book Test Meeting
  const handleBookTestMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMeetingForm.attendeeEmail.trim()) {
      toastError('Validation Error', 'Attendee customer email is required.');
      return;
    }

    setIsBookingMeeting(true);
    try {
      const res = await integrationsApi.createMeeting({
        title: testMeetingForm.title,
        attendeeEmail: testMeetingForm.attendeeEmail.trim(),
        startTime: new Date(testMeetingForm.startTime).toISOString(),
        endTime: new Date(testMeetingForm.endTime).toISOString(),
      });
      success(
        'Meeting Scheduled',
        `Google Meet invitation created! ${res.meetLink ? `Link: ${res.meetLink}` : ''}`,
      );
      await loadAll();
    } catch (err: any) {
      toastError('Meeting Booking Failed', handleApiError(err));
    } finally {
      setIsBookingMeeting(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading Third-Party Integrations..." className="py-20" />;
  }

  const wa = getIntegration('WHATSAPP');
  const meta = getIntegration('FACEBOOK_META');
  const gmail = getIntegration('GMAIL');
  const gcal = getIntegration('GOOGLE_CALENDAR');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Overview Intro Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Third-Party Platform Integrations</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Strict Tenant Isolation
            </span>
          </div>
          <p className="text-caption text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Connect verified marketing and communication channels. Tokens are encrypted with AES-256-GCM and stored exclusively in the backend vault with zero browser credential leakage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (googleConfig?.fullClientId) {
                setConfigForm({ clientId: googleConfig.fullClientId, clientSecret: '' });
              }
              setIsConfigModalOpen(true);
            }}
            className={
              googleConfig?.isConfigured
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50/60'
                : 'border-amber-300 text-amber-800 bg-amber-50/60'
            }
          >
            {googleConfig?.isConfigured ? '✓ Google 1-Click Active' : '⚙️ Setup Google OAuth'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAll}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Status
          </Button>
        </div>
      </div>

      {/* 4 Supported Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ================================================================= */}
        {/* 1. WHATSAPP BUSINESS                                              */}
        {/* ================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <WhatsAppIcon className="w-10 h-10 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    WhatsApp Business
                    {wa.status === 'CONNECTED' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </h4>
                  <p className="text-caption text-slate-500">
                    Official Cloud API for template notifications & automated chat
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                  wa.status === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {wa.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
              </span>
            </div>

            {/* Connected Details Preview */}
            {wa.status === 'CONNECTED' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Phone Number:</span>
                  <span className="font-semibold text-slate-800">{wa.accountIdentifier}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Business Name:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[180px]">
                    {wa.accountName}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Approved Templates:</span>
                  <span className="font-semibold text-emerald-700">
                    {wa.metadata?.templatesCount || 0} Ready
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Last Synced:</span>
                  <span>{formatLastSync(wa.lastSyncAt)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/60 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                <p>• Connect WhatsApp Business Account (WABA).</p>
                <p>• Select phone number and retrieve approved templates.</p>
                <p>• Automatic incoming customer message webhook handling.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {wa.status === 'CONNECTED' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal('WHATSAPP')}
                >
                  Manage & Templates
                </Button>
                <button
                  type="button"
                  onClick={() => handleDisconnect('WHATSAPP')}
                  disabled={isDisconnecting === 'WHATSAPP'}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setActiveModal('WHATSAPP')}
              >
                Connect WhatsApp
              </Button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. FACEBOOK & META ADS                                            */}
        {/* ================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <MetaIcon className="w-10 h-10 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Facebook & Meta Ads
                    {meta.status === 'CONNECTED' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </h4>
                  <p className="text-caption text-slate-500">
                    Instant Lead Ads synchronization & campaign intake
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                  meta.status === 'CONNECTED'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {meta.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
              </span>
            </div>

            {/* Connected Details Preview */}
            {meta.status === 'CONNECTED' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Account:</span>
                  <span className="font-semibold text-slate-800">{meta.accountName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Selected Page:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[180px]">
                    {meta.metadata?.selectedPageName || 'Not Selected'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Lead Webhook:</span>
                  <span className="font-semibold text-emerald-700">Subscribed & Active</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Last Synced:</span>
                  <span>{formatLastSync(meta.lastSyncAt)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/60 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                <p>• Meta OAuth login or System User Access Token.</p>
                <p>• Select Business Account, Ad Account & Facebook Page.</p>
                <p>• Webhook auto-ingests new lead ad form submissions.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {meta.status === 'CONNECTED' ? (
              <>
                <Button size="sm" variant="outline" onClick={handleOpenMetaManage}>
                  Manage & Forms
                </Button>
                <button
                  type="button"
                  onClick={() => handleDisconnect('FACEBOOK_META')}
                  disabled={isDisconnecting === 'FACEBOOK_META'}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setActiveModal('FACEBOOK_META')}
              >
                Connect Meta Ads
              </Button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. GMAIL                                                          */}
        {/* ================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <GmailIcon className="w-10 h-10 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Gmail
                    {gmail.status === 'CONNECTED' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </h4>
                  <p className="text-caption text-slate-500">
                    Authorized email dispatch & lead follow-up thread handling
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                  gmail.status === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {gmail.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
              </span>
            </div>

            {/* Connected Details Preview */}
            {gmail.status === 'CONNECTED' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Authenticated Email:</span>
                  <span className="font-semibold text-slate-800">{gmail.accountIdentifier}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Profile Name:</span>
                  <span className="font-medium text-slate-800">{gmail.accountName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Permissions:</span>
                  <span className="font-semibold text-slate-700">gmail.send, userinfo</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Last Synced:</span>
                  <span>{formatLastSync(gmail.lastSyncAt)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/60 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                <p>• Google OAuth with minimal scope (gmail.send).</p>
                <p>• Send follow-up emails directly from your corporate inbox.</p>
                <p>• Automatic token refresh ensures uninterrupted operations.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {gmail.status === 'CONNECTED' ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setActiveModal('GMAIL')}>
                  Test Send & Settings
                </Button>
                <button
                  type="button"
                  onClick={() => handleDisconnect('GMAIL')}
                  disabled={isDisconnecting === 'GMAIL'}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                onClick={() => setActiveModal('GMAIL')}
              >
                Connect Gmail
              </Button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. GOOGLE CALENDAR                                                */}
        {/* ================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <GoogleCalendarIcon className="w-10 h-10 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Google Calendar
                    {gcal.status === 'CONNECTED' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </h4>
                  <p className="text-caption text-slate-500">
                    Real-time slot availability & Google Meet consultation booking
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                  gcal.status === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {gcal.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
              </span>
            </div>

            {/* Connected Details Preview */}
            {gcal.status === 'CONNECTED' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Account:</span>
                  <span className="font-semibold text-slate-800">{gcal.accountIdentifier}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Selected Calendar:</span>
                  <span className="font-semibold text-blue-700">
                    {gcal.metadata?.calendarSummary || 'Primary Calendar'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Auto Video Link:</span>
                  <span className="font-medium text-emerald-700">Google Meet Enabled</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Last Synced:</span>
                  <span>{formatLastSync(gcal.lastSyncAt)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/60 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                <p>• Google OAuth with calendar.events permissions.</p>
                <p>• Real-time availability check during AI customer calls.</p>
                <p>• Automatically schedules meetings with Google Meet URLs.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {gcal.status === 'CONNECTED' ? (
              <>
                <Button size="sm" variant="outline" onClick={handleOpenCalendarManage}>
                  Manage & Booking
                </Button>
                <button
                  type="button"
                  onClick={() => handleDisconnect('GOOGLE_CALENDAR')}
                  disabled={isDisconnecting === 'GOOGLE_CALENDAR'}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setActiveModal('GOOGLE_CALENDAR')}
              >
                Connect Google Calendar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: WHATSAPP BUSINESS MANAGEMENT & CONNECT MODAL                 */}
      {/* ===================================================================== */}
      {activeModal === 'WHATSAPP' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="WhatsApp Business Cloud API"
          maxWidth="lg"
        >
          {wa.status === 'CONNECTED' ? (
            <div className="space-y-5 text-xs">
              {/* Connected Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <WhatsAppIcon className="w-6 h-6" />
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      {wa.accountName} ({wa.accountIdentifier})
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      WABA ID: {wa.metadata?.wabaId} • Quality Rating:{' '}
                      <strong className="uppercase">{wa.metadata?.qualityRating}</strong>
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncTemplates}
                  isLoading={isSyncingWaTemplates}
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                >
                  Sync Templates
                </Button>
              </div>

              {/* Message Templates Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Approved Message Templates ({wa.metadata?.templates?.length || 0})
                  </span>
                  <span className="text-caption text-slate-400">
                    Retrieved from Meta Graph API
                  </span>
                </div>

                {wa.metadata?.templates?.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Template Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Language</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {wa.metadata.templates.map((tpl: any, idx: number) => (
                          <tr key={tpl.id || idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 font-mono font-medium text-slate-900">
                              {tpl.name}
                            </td>
                            <td className="py-2 px-3 text-slate-500 uppercase text-[10px]">
                              {tpl.category}
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                              {tpl.language}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3" />
                                {tpl.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg p-4 text-slate-400">
                    No approved templates found in this WABA account.
                  </div>
                )}
              </div>

              {/* Webhook Endpoint Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-slate-600">
                <span className="font-semibold text-slate-800 block text-[11px]">
                  Configured Inbound Webhook Endpoint:
                </span>
                <code className="font-mono text-[11px] text-blue-700 bg-white px-2 py-1 rounded border border-slate-200 block truncate select-all">
                  https://api.acrmplatform.com/api/integrations/webhook/meta
                </code>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect('WHATSAPP')}
                  isLoading={isDisconnecting === 'WHATSAPP'}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Disconnect WhatsApp
                </Button>
                <Button size="sm" onClick={() => setActiveModal(null)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnectWhatsApp} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-caption leading-relaxed">
                Enter your WhatsApp Business Cloud API credentials from the{' '}
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-blue-700 inline-flex items-center gap-0.5"
                >
                  Meta Developer Portal <ExternalLink className="w-2.5 h-2.5" />
                </a>
                . The backend verifies credentials against Graph API v21.0 and securely encrypts tokens with AES-256-GCM.
              </div>

              <div>
                <Input
                  label="WhatsApp Business Account (WABA) ID"
                  required
                  value={waForm.wabaId}
                  onChange={(e) => setWaForm({ ...waForm, wabaId: e.target.value })}
                  placeholder="e.g. 109283746592819"
                />
              </div>

              <div>
                <Input
                  label="Phone Number ID"
                  required
                  value={waForm.phoneNumberId}
                  onChange={(e) => setWaForm({ ...waForm, phoneNumberId: e.target.value })}
                  placeholder="e.g. 104928374829102"
                />
              </div>

              <div>
                <Input
                  label="Permanent System User Access Token"
                  type="password"
                  required
                  value={waForm.accessToken}
                  onChange={(e) => setWaForm({ ...waForm, accessToken: e.target.value })}
                  placeholder="EAABw..."
                />
                <p className="text-caption text-slate-400 mt-1">
                  Stored securely with AES-256-GCM encryption. Never sent to frontend or logs.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isConnectingWa}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Verify & Connect
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: META ADS CONFIGURATION & CONNECT MODAL                       */}
      {/* ===================================================================== */}
      {activeModal === 'FACEBOOK_META' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Facebook & Meta Ads Integration"
          maxWidth="lg"
        >
          {meta.status === 'CONNECTED' ? (
            <div className="space-y-5 text-xs">
              {isLoadingMetaAssets ? (
                <Spinner label="Refreshing Meta Pages & Lead Forms..." className="py-8" />
              ) : (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-950 block">
                        Connected: {meta.accountName}
                      </span>
                      <span className="text-[11px] text-blue-800">
                        Lead Webhook Subscription: <strong>Active</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      LIVE
                    </span>
                  </div>

                  {/* Page Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Target Facebook Page
                    </label>
                    <select
                      value={selectedMetaConfig.pageId}
                      onChange={(e) =>
                        setSelectedMetaConfig({ ...selectedMetaConfig, pageId: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 outline-none"
                    >
                      {(metaAssets?.pages || []).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category || 'Page'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ad Account Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Ad Account for Lead Generation
                    </label>
                    <select
                      value={selectedMetaConfig.adAccountId}
                      onChange={(e) =>
                        setSelectedMetaConfig({ ...selectedMetaConfig, adAccountId: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 outline-none"
                    >
                      {(metaAssets?.adAccounts || []).map((a: any) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (ID: {a.accountId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lead Forms Checklist */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Active Instant Lead Forms ({(metaAssets?.leadForms || []).length})
                    </label>
                    {(metaAssets?.leadForms || []).length > 0 ? (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto">
                        {metaAssets?.leadForms.map((f: any) => (
                          <label
                            key={f.id}
                            className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMetaConfig.leadFormIds.includes(f.id)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...selectedMetaConfig.leadFormIds, f.id]
                                  : selectedMetaConfig.leadFormIds.filter((id) => id !== f.id);
                                setSelectedMetaConfig({ ...selectedMetaConfig, leadFormIds: next });
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-slate-800 block truncate">
                                {f.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ID: {f.id} • Status: {f.status}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-caption text-slate-400 py-2">
                        No active Instant Lead Forms found on selected Facebook Page.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('FACEBOOK_META')}
                      isLoading={isDisconnecting === 'FACEBOOK_META'}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Disconnect Meta
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveModal(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveMetaConfig}
                        isLoading={isSavingMetaConfig}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Save Selections
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <span className="font-bold text-blue-950 block">Option 1: Sign in with Meta OAuth</span>
                <p className="text-caption text-blue-800">
                  Authorize your Facebook Business and Ad Account with pre-configured OAuth.
                </p>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={async () => {
                    const res = await integrationsApi.getOAuthUrl('FACEBOOK_META');
                    if (res.oauthUrl) window.location.href = res.oauthUrl;
                    else toastError('Setup Notice', res.message || 'Meta OAuth App ID not configured');
                  }}
                >
                  <MetaIcon className="w-4 h-4" />
                  Continue with Facebook OAuth
                </Button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-slate-400 text-caption uppercase font-semibold">
                  Or Direct Access Token
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleConnectMeta} className="space-y-3">
                <Input
                  label="System User or User Access Token"
                  type="password"
                  required
                  value={metaForm.accessToken}
                  onChange={(e) => setMetaForm({ accessToken: e.target.value })}
                  placeholder="EAA..."
                />
                <p className="text-caption text-slate-400">
                  Required scopes: <code>pages_show_list</code>, <code>leads_retrieval</code>,{' '}
                  <code>ads_management</code>.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isConnectingMeta}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Verify & Connect
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: GMAIL TEST SEND & MANAGEMENT MODAL                          */}
      {/* ===================================================================== */}
      {activeModal === 'GMAIL' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Gmail Integration & Email Dispatch"
          maxWidth="md"
        >
          {gmail.status === 'CONNECTED' ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block">
                    {gmail.accountName} ({gmail.accountIdentifier})
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Authorized Scopes: <code>gmail.send</code>, <code>gmail.readonly</code>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-3">
                <span className="font-bold text-slate-800 block">
                  Send Verified Test Email via Gmail API
                </span>

                <div>
                  <Input
                    label="Recipient Email Address"
                    type="email"
                    required
                    value={testEmailForm.to}
                    onChange={(e) => setTestEmailForm({ ...testEmailForm, to: e.target.value })}
                    placeholder="recipient@example.com"
                  />
                </div>

                <div>
                  <Input
                    label="Subject Line"
                    required
                    value={testEmailForm.subject}
                    onChange={(e) =>
                      setTestEmailForm({ ...testEmailForm, subject: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={3}
                    value={testEmailForm.bodyContent}
                    onChange={(e) =>
                      setTestEmailForm({ ...testEmailForm, bodyContent: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect('GMAIL')}
                    isLoading={isDisconnecting === 'GMAIL'}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Disconnect Gmail
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isSendingEmail}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Test Email
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {!googleConfig?.isConfigured ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Google Cloud 1-Click OAuth Setup
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => setIsConfigModalOpen(true)}
                    >
                      Setup Guide & Keys (2 mins)
                    </Button>
                  </div>
                  <p className="text-caption text-amber-800 leading-relaxed">
                    Google OAuth requires registering a free Client ID in Google Cloud. Click <strong>Setup Guide & Keys</strong> to paste your Client ID, or connect your account email directly below.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <span className="font-bold text-blue-950 block">Option 1: Sign in with Google OAuth</span>
                  <p className="text-caption text-blue-800 leading-relaxed">
                    Authorize your Google Account via official Google consent screen with minimal <code>gmail.send</code> scope.
                  </p>
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
                    onClick={() => handleLaunchGoogleOAuth('GMAIL')}
                  >
                    <GmailIcon className="w-4 h-4" />
                    Sign in with Google
                  </Button>
                </div>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-slate-400 text-caption uppercase font-semibold">
                  Or Direct Access / Account Details
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={(e) => handleConnectGoogle(e, 'GMAIL')} className="space-y-3">
                <div>
                  <Input
                    label="Google Account Email *"
                    type="email"
                    required
                    value={googleForm.email}
                    onChange={(e) => setGoogleForm({ ...googleForm, email: e.target.value })}
                    placeholder="e.g. sales@company.com"
                  />
                </div>

                <div>
                  <Input
                    label="Google OAuth Access Token (Optional)"
                    type="password"
                    value={googleForm.accessToken}
                    onChange={(e) => setGoogleForm({ ...googleForm, accessToken: e.target.value })}
                    placeholder="ya29.a0AfH6SM..."
                  />
                  <p className="text-caption text-slate-400 mt-1">
                    Encrypted with AES-256-GCM. Used for authorized email sending via Google Gmail REST API.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isConnectingGoogle}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Verify & Connect Gmail
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: GOOGLE CALENDAR MANAGEMENT & TEST BOOKING                   */}
      {/* ===================================================================== */}
      {activeModal === 'GOOGLE_CALENDAR' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Google Calendar & Meeting Scheduling"
          maxWidth="lg"
        >
          {gcal.status === 'CONNECTED' ? (
            <div className="space-y-5 text-xs">
              {isLoadingCalendars ? (
                <Spinner label="Loading Google Calendars..." className="py-8" />
              ) : (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-950 block">
                        Account: {gcal.accountIdentifier}
                      </span>
                      <span className="text-[11px] text-blue-800">
                        Currently Selected:{' '}
                        <strong>{gcal.metadata?.calendarSummary || 'Primary Calendar'}</strong>
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenCalendarManage}
                      leftIcon={<RefreshCw className="w-3 h-3" />}
                    >
                      Refresh
                    </Button>
                  </div>

                  {/* Calendar Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Select Target Google Calendar
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCalId}
                        onChange={(e) => setSelectedCalId(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 outline-none"
                      >
                        {calendarsList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.summary} {c.primary ? '(Primary)' : ''} — {c.timeZone}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={handleSaveCalendarConfig}
                        isLoading={isSavingCalendar}
                        className="bg-slate-900 text-white"
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* Test Consultation Meeting Booking Form */}
                  <form
                    onSubmit={handleBookTestMeeting}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
                  >
                    <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-blue-600" />
                      Test Customer Meeting Booking with Google Meet
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Input
                          label="Meeting Title"
                          value={testMeetingForm.title}
                          onChange={(e) =>
                            setTestMeetingForm({ ...testMeetingForm, title: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Input
                          label="Customer Attendee Email"
                          type="email"
                          required
                          value={testMeetingForm.attendeeEmail}
                          onChange={(e) =>
                            setTestMeetingForm({ ...testMeetingForm, attendeeEmail: e.target.value })
                          }
                          placeholder="customer@gmail.com"
                        />
                      </div>
                      <div>
                        <Input
                          label="Start Date & Time"
                          type="datetime-local"
                          value={testMeetingForm.startTime}
                          onChange={(e) =>
                            setTestMeetingForm({ ...testMeetingForm, startTime: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Input
                          label="End Date & Time"
                          type="datetime-local"
                          value={testMeetingForm.endTime}
                          onChange={(e) =>
                            setTestMeetingForm({ ...testMeetingForm, endTime: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        size="sm"
                        isLoading={isBookingMeeting}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Create Calendar Event
                      </Button>
                    </div>
                  </form>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('GOOGLE_CALENDAR')}
                      isLoading={isDisconnecting === 'GOOGLE_CALENDAR'}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Disconnect Calendar
                    </Button>
                    <Button size="sm" onClick={() => setActiveModal(null)}>
                      Done
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {!googleConfig?.isConfigured ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Google Cloud 1-Click OAuth Setup
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => setIsConfigModalOpen(true)}
                    >
                      Setup Guide & Keys (2 mins)
                    </Button>
                  </div>
                  <p className="text-caption text-amber-800 leading-relaxed">
                    Google OAuth requires registering a free Client ID in Google Cloud. Click <strong>Setup Guide & Keys</strong> to paste your Client ID, or connect your account email directly below.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <span className="font-bold text-blue-950 block">Option 1: Sign in with Google OAuth</span>
                  <p className="text-caption text-blue-800 leading-relaxed">
                    Connect your Google Calendar to allow the AI voice agent to query real-time calendar availability and schedule customer meetings with Google Meet links.
                  </p>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    onClick={() => handleLaunchGoogleOAuth('GOOGLE_CALENDAR')}
                  >
                    <GoogleCalendarIcon className="w-4 h-4" />
                    Sign in with Google
                  </Button>
                </div>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-slate-400 text-caption uppercase font-semibold">
                  Or Direct Access / Account Details
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={(e) => handleConnectGoogle(e, 'GOOGLE_CALENDAR')} className="space-y-3">
                <div>
                  <Input
                    label="Google Account Email *"
                    type="email"
                    required
                    value={googleForm.email}
                    onChange={(e) => setGoogleForm({ ...googleForm, email: e.target.value })}
                    placeholder="e.g. calendar@company.com"
                  />
                </div>

                <div>
                  <Input
                    label="Google OAuth Access Token (Optional)"
                    type="password"
                    value={googleForm.accessToken}
                    onChange={(e) => setGoogleForm({ ...googleForm, accessToken: e.target.value })}
                    placeholder="ya29.a0AfH6SM..."
                  />
                  <p className="text-caption text-slate-400 mt-1">
                    Encrypted with AES-256-GCM. Used for querying free/busy calendar slots and creating calendar entries.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isConnectingGoogle}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Verify & Connect Calendar
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: GOOGLE CLOUD OAUTH SETUP GUIDE & CREDENTIALS CONFIG          */}
      {/* ===================================================================== */}
      {isConfigModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConfigModalOpen(false)}
          title="Google Cloud OAuth 2.0 Setup Guide"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2 text-blue-950">
              <span className="font-bold block text-sm">
                How Google Integration Works on Websites
              </span>
              <p className="text-caption text-blue-800 leading-relaxed">
                Google protects your account security: websites never see your Google password. Instead, Google uses <strong>OAuth 2.0</strong>. Once you add your free Google Cloud <strong>Client ID</strong> below, anyone in your workspace can connect their Gmail or Google Calendar with <strong>1 single click</strong> on &quot;Sign in with Google&quot;.
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
              <span className="font-bold text-slate-800 block text-xs">
                3 Simple Steps to Get Your Free Google Client ID:
              </span>

              <ol className="list-decimal list-inside space-y-2 text-slate-600 leading-relaxed text-caption">
                <li>
                  <strong className="text-slate-800">Open Google Cloud Console:</strong> Visit{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold underline inline-flex items-center gap-0.5"
                  >
                    console.cloud.google.com/apis/credentials <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  (sign in with any Gmail/Google account, it is completely free).
                </li>
                <li>
                  <strong className="text-slate-800">Enable Gmail & Calendar APIs:</strong> In the top search bar, search for <strong>Gmail API</strong> and <strong>Google Calendar API</strong> and click <strong>Enable</strong> on both.
                </li>
                <li>
                  <strong className="text-slate-800">Create OAuth 2.0 Client ID:</strong>
                  <div className="mt-1 pl-4 space-y-1">
                    <p>• Click <strong>Create Credentials</strong> &gt; <strong>OAuth client ID</strong>.</p>
                    <p>• Application Type: select <strong>Web application</strong>.</p>
                    <p>• Under <strong>Authorized redirect URIs</strong>, paste this exact URL:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-slate-100 border border-slate-200 text-blue-700 px-2 py-1 rounded font-mono text-[11px] flex-1 truncate select-all">
                        {googleConfig?.redirectUri || 'http://localhost:3010/workspace/ai-calling?tab=integrations'}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(googleConfig?.redirectUri || 'http://localhost:3010/workspace/ai-calling?tab=integrations');
                            setHasCopiedUri(true);
                            setTimeout(() => setHasCopiedUri(false), 2000);
                          }
                        }}
                      >
                        {hasCopiedUri ? 'Copied!' : 'Copy URI'}
                      </Button>
                    </div>
                  </div>
                </li>
                <li>
                  <strong className="text-slate-800">Copy & Paste:</strong> Copy the generated <strong>Client ID</strong> and <strong>Client Secret</strong> from Google and paste them below.
                </li>
              </ol>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveGoogleConfig} className="space-y-3 pt-2">
              <div>
                <Input
                  label="Google Client ID *"
                  required
                  value={configForm.clientId}
                  onChange={(e) => setConfigForm({ ...configForm, clientId: e.target.value })}
                  placeholder="e.g. 1234567890-abcdefg123456.apps.googleusercontent.com"
                />
              </div>

              <div>
                <Input
                  label="Google Client Secret *"
                  type="password"
                  value={configForm.clientSecret}
                  onChange={(e) => setConfigForm({ ...configForm, clientSecret: e.target.value })}
                  placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-caption text-slate-400 mt-1">
                  Saved securely in backend environment. Required to exchange login codes for refresh tokens.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsConfigModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSavingConfig}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save & Enable 1-Click Sign-in
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
