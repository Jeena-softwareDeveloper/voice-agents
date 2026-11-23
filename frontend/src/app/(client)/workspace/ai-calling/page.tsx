'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { aiCallingApi, AiCallingOverviewData } from '@/features/ai-calling/api/ai-calling.api';
import { settingsApi } from '@/features/settings/api/settings.api';
import { servicesApi } from '@/features/services/api/services.api';
import { TelephonyNumber, Service } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { Modal } from '@/components/common/modals/Modal';
import { Spinner } from '@/components/common/loaders/Spinner';
import { useToast } from '@/components/common/feedback/Toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  Building2,
  Phone,
  Bot,
  CheckCircle2,
  PhoneCall,
  CreditCard,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { SarvamVoiceTestAgent } from '@/features/ai-calling/components/SarvamVoiceTestAgent';
import { DynamicTelephonyManagement } from '@/features/ai-calling/components/DynamicTelephonyManagement';
import { IntegrationsDashboard } from '@/features/integrations/components/IntegrationsDashboard';

export default function ConfigurationPage() {
  const { success, error: toastError, info } = useToast();

  // Configuration Tabs: Company Profile | Caller ID & Phone Numbers | Voice Agent Studio | Integrations
  const [activeTab, setActiveTab] = useState<'studio' | 'company' | 'telephony' | 'integrations'>('studio');

  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<AiCallingOverviewData | null>(null);
  const [tenantServices, setTenantServices] = useState<Service[]>([]);

  // Tab 1: Company Profile State
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    category: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
  });
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Tab 2: Telephony State
  const [phoneData, setPhoneData] = useState<{
    assigned: TelephonyNumber | null;
    available: TelephonyNumber[];
  } | null>(null);
  const [callingSettings, setCallingSettings] = useState({
    startHour: 9,
    endHour: 20,
    maxDailyCalls: 500,
    maxRetries: 3,
    isAutomatedCallingEnabled: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Credit Top-Up Modal
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(1000);
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    loadAll(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'integrations' || tab === 'company' || tab === 'telephony' || tab === 'studio') {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const loadAll = async (showFullSpinner = false) => {
    if (showFullSpinner) {
      setIsLoading(true);
    }
    try {
      const [overviewRes, phoneRes, servicesRes, companyRes, callingSettingsRes] =
        await Promise.all([
          aiCallingApi.getOverview(),
          aiCallingApi.getPhoneNumbers(),
          servicesApi.getTenantServices(),
          settingsApi.getCompanyProfile().catch(() => null),
          settingsApi.getTenantCallingSettings().catch(() => null),
        ]);

      setOverview(overviewRes);
      setPhoneData(phoneRes);
      setTenantServices(servicesRes || []);

      if (companyRes) {
        setCompanyForm({
          companyName: companyRes.companyName || overviewRes?.tenant.name || '',
          category: companyRes.businessType || '',
          email: companyRes.email || '',
          phone: companyRes.phone || '',
          website: companyRes.website || '',
          address: companyRes.address || '',
          city: companyRes.city || '',
          state: companyRes.state || '',
        });
      } else if (overviewRes?.tenant) {
        setCompanyForm({
          companyName: overviewRes.tenant.name || '',
          category: '',
          email: '',
          phone: '',
          website: '',
          address: '',
          city: '',
          state: '',
        });
      }

      if (callingSettingsRes) {
        setCallingSettings({
          startHour: callingSettingsRes.startHour || 9,
          endHour: callingSettingsRes.endHour || 20,
          maxDailyCalls: callingSettingsRes.maxDailyCalls || 500,
          maxRetries: callingSettingsRes.maxRetries || 3,
          isAutomatedCallingEnabled: callingSettingsRes.isAutomatedCallingEnabled ?? true,
        });
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load configuration', handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 1: Save Company Name & Profile
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.companyName.trim()) {
      toastError('Validation Error', 'Company name is required.');
      return;
    }

    setIsSavingCompany(true);
    try {
      const res = await settingsApi.updateCompanyProfile({
        companyName: companyForm.companyName.trim(),
        businessType: companyForm.category,
        email: companyForm.email,
        phone: companyForm.phone,
        website: companyForm.website,
        address: companyForm.address,
        city: companyForm.city,
        state: companyForm.state,
      });

      // Update local storage so sidebar immediately updates
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.tenant) {
            u.tenant.name = res.companyName;
            if (u.tenant.businessProfile) {
              u.tenant.businessProfile.businessName = res.companyName;
            }
            localStorage.setItem('user', JSON.stringify(u));
          }
        }
      } catch {
        // ignore
      }

      success('Company Profile Updated', 'Registered business information saved successfully.');
    } catch (err: any) {
      toastError('Save Failed', handleApiError(err));
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Tab 2: Save Calling Schedule
  const handleSaveCallingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await settingsApi.updateTenantCallingSettings(callingSettings);
      success('Schedule Saved', 'Automated dialer hours and retry policies updated.');
    } catch (err: any) {
      toastError('Save Failed', handleApiError(err));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Credit Top-Up
  const handleTopUp = async () => {
    setIsRecharging(true);
    try {
      const res = await aiCallingApi.topUpCredits(topUpAmount);
      success('Recharge Complete', `Added ₹${topUpAmount}. New balance: ₹${res.newBalance.toFixed(2)}`);
      setIsTopUpOpen(false);
      await loadAll();
    } catch (err: any) {
      toastError('Recharge Failed', handleApiError(err));
    } finally {
      setIsRecharging(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading Configuration..." className="py-20" />;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Configuration"
        description="Manage company profile, telephony caller IDs, and AI voice agent runtime settings."
        breadcrumbs={[
          { label: 'Workspace', href: '/workspace/dashboard' },
          { label: 'Configuration' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={() => setIsTopUpOpen(true)}
            >
              Recharge Credits (₹{Number(overview?.tenant.creditBalance ?? 450).toFixed(2)})
            </Button>
            <Link href="/workspace/calls">
              <Button size="sm" variant="outline" leftIcon={<PhoneCall className="w-3.5 h-3.5" />}>
                Calls & Leads
              </Button>
            </Link>
          </div>
        }
      />

      {/* COMPACT THREE-TAB NAVIGATION */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto bg-white px-2 py-1 rounded-t-lg shadow-2xs">
        {/* TAB 1: COMPANY PROFILE */}
        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'company'
            ? 'bg-blue-50 text-blue-700 shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Building2 className={`w-4 h-4 ${activeTab === 'company' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Company Profile</span>
        </button>

        {/* TAB 2: CALLER ID & PHONE NUMBERS */}
        <button
          type="button"
          onClick={() => setActiveTab('telephony')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'telephony'
            ? 'bg-blue-50 text-blue-700 shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Phone className={`w-4 h-4 ${activeTab === 'telephony' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Caller ID & Phone Numbers</span>
          {phoneData?.assigned && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Caller ID Assigned" />
          )}
        </button>

        {/* TAB 3: VOICE AGENT STUDIO (PRIMARY) */}
        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'studio'
            ? 'bg-blue-50 text-blue-700 shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Bot className={`w-4 h-4 ${activeTab === 'studio' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>Voice Agent Studio</span>
          <span className="text-micro font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Primary
          </span>
        </button>

        {/* TAB 4: INTEGRATIONS */}
        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'integrations'
            ? 'bg-blue-50 text-blue-700 shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === 'integrations' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Integrations</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: COMPANY NAME SECTION                                     */}
      {/* ============================================================== */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-150">
          <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Business Identity</h3>
                <p className="text-caption text-slate-500">
                  Update your official company name and contact credentials represented by the AI voice agent.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <div>
                <Input
                  label="Company Name"
                  required
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  placeholder="e.g. Acme Corporation Pvt Ltd"
                />
                <p className="text-caption text-slate-400 mt-1">
                  This company name is loaded dynamically by the AI Voice Agent during calls.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Input
                    label="Business Category / Industry"
                    value={companyForm.category}
                    onChange={(e) => setCompanyForm({ ...companyForm, category: e.target.value })}
                    placeholder="e.g. Real Estate / Healthcare / IT SaaS"
                  />
                </div>
                <div>
                  <Input
                    label="Website URL"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Input
                    label="Official Contact Email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <Input
                    label="Official Phone Number"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Office Address
                </label>
                <textarea
                  rows={2}
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  placeholder="Street Address, City, State..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed text-slate-900 transition-all"
                />
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <Button type="submit" size="sm" isLoading={isSavingCompany}>
                  Save Company Details
                </Button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Tenant Compliance</h4>
              <dl className="space-y-2.5">
                <div>
                  <dt className="text-caption text-slate-400">Tenant Account ID</dt>
                  <dd className="font-mono text-caption font-semibold text-slate-800 break-all">
                    {overview?.tenant.id || 'Current Tenant'}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-slate-400">Account Status</dt>
                  <dd className="mt-0.5">
                    <span className="inline-flex items-center gap-1 text-caption font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Active & Compliant
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-slate-400">Telephony Routing</dt>
                  <dd className="text-caption font-semibold text-slate-800">
                    Sarvam Managed Telephony
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CALLER ID & PHONE NUMBERS SECTION                        */}
      {/* ============================================================== */}
      {activeTab === 'telephony' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <DynamicTelephonyManagement
            services={tenantServices}
            onRefreshOverview={loadAll}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: VOICE AGENT STUDIO SECTION (PRIMARY)                    */}
      {/* ============================================================== */}
      {activeTab === 'studio' && (
        <div className="animate-in fade-in duration-150">
          <SarvamVoiceTestAgent
            services={tenantServices}
            companyName={companyForm.companyName || overview?.tenant.name}
            onRefresh={loadAll}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: INTEGRATIONS SECTION                                     */}
      {/* ============================================================== */}
      {activeTab === 'integrations' && (
        <div className="animate-in fade-in duration-150">
          <IntegrationsDashboard />
        </div>
      )}

      {/* Credit Top-Up Modal */}
      <Modal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        title="Recharge AI Calling Credits"
        maxWidth="sm"
      >
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          <p className="text-caption text-slate-600">
            Current balance: ₹{Number(overview?.tenant.creditBalance ?? 450).toFixed(2)}. Select top-up amount:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[500, 1000, 2500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTopUpAmount(amt)}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition ${topUpAmount === amt
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTopUpOpen(false)}
              disabled={isRecharging}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleTopUp} isLoading={isRecharging}>
              Recharge ₹{topUpAmount}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
