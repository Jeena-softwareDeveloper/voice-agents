'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { SarvamVoiceTestAgent } from '@/features/ai-calling/components/SarvamVoiceTestAgent';

export default function ConfigurationPage() {
  const { success, error: toastError, info } = useToast();

  // Exactly Three Tabs: Company Name | Caller ID & Phone Numbers | Voice Agent Studio
  const [activeTab, setActiveTab] = useState<'studio' | 'company' | 'telephony'>('studio');

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

  // Phone Allocation / Request Modal
  const [isNumberModalOpen, setIsNumberModalOpen] = useState(false);
  const [selectedNumberId, setSelectedNumberId] = useState('');
  const [kycSignatory, setKycSignatory] = useState('Authorized Officer');
  const [kycGstin, setKycGstin] = useState('27AAACJ1234F1Z5');
  const [isRequestingNumber, setIsRequestingNumber] = useState(false);

  // Release Number Confirmation Modal
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isReleasingNumber, setIsReleasingNumber] = useState(false);

  // Credit Top-Up Modal
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(1000);
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
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

  // Tab 2: Request / Assign Phone Number
  const handleRequestNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNumberId) {
      toastError('Selection Required', 'Please select a phone number from the available inventory.');
      return;
    }

    setIsRequestingNumber(true);
    try {
      await aiCallingApi.requestPhoneNumber({
        numberId: selectedNumberId,
        businessKyc: {
          authorizedSignatoryName: kycSignatory,
          gstin: kycGstin,
        },
      });

      success('Number Allocated', 'TRAI-compliant caller ID number assigned to your account.');
      setIsNumberModalOpen(false);
      setSelectedNumberId('');
      await loadAll();
    } catch (err: any) {
      toastError('Request Failed', handleApiError(err));
    } finally {
      setIsRequestingNumber(false);
    }
  };

  // Tab 2: Release Number
  const handleReleaseNumber = async () => {
    if (!phoneData?.assigned) return;

    setIsReleasingNumber(true);
    try {
      await aiCallingApi.releasePhoneNumber(phoneData.assigned.id);
      success('Number Released', 'Phone number has been released back to the telecom pool.');
      setIsReleaseModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toastError('Release Failed', handleApiError(err));
    } finally {
      setIsReleasingNumber(false);
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
          className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'company'
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
          className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'telephony'
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
          className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'studio'
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
                  className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-hidden focus:border-blue-500 leading-relaxed text-slate-900"
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
                  <dt className="text-caption text-slate-400">Telecom Jurisdiction</dt>
                  <dd className="text-caption font-semibold text-slate-800">
                    India (TRAI / DoT Regulated)
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
          {/* Active Assigned Caller ID */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Configured Caller ID & Telephony Route</h3>
                  <p className="text-caption text-slate-500">
                    Official phone number displayed on customers' caller ID screens during automated outbound calls.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsNumberModalOpen(true)}
                >
                  {phoneData?.assigned ? 'Change Number' : 'Request Caller ID'}
                </Button>
                {phoneData?.assigned && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-red-50 text-red-600 border-slate-200"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => setIsReleaseModalOpen(true)}
                  >
                    Release Number
                  </Button>
                )}
              </div>
            </div>

            {phoneData?.assigned ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/60 border border-slate-200/80">
                <div className="md:col-span-2 space-y-1">
                  <span className="text-caption text-slate-400 font-semibold uppercase tracking-wider block">
                    Active Caller ID
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-lg font-bold text-slate-900">
                      {phoneData.assigned.number}
                    </span>
                    <span className="inline-flex items-center gap-1 text-micro font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE
                    </span>
                    <span className="inline-flex items-center gap-1 text-micro font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      KYC VERIFIED
                    </span>
                  </div>
                  <p className="text-caption text-slate-500">
                    {phoneData.assigned.region} • {phoneData.assigned.type}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-caption text-slate-400 font-semibold uppercase tracking-wider block">
                    Telephony Trunk
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block">
                    {phoneData.assigned.provider ? phoneData.assigned.provider.replace(/Sarvam/gi, 'Jeenora') : 'Jeenora Voice Trunk'}
                  </span>
                  <span className="text-caption text-slate-500 block">TRAI Compliant CLI</span>
                </div>

                <div className="space-y-1">
                  <span className="text-caption text-slate-400 font-semibold uppercase tracking-wider block">
                    Monthly Route Rent
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block">
                    ₹{phoneData.assigned.monthlyRent}/month
                  </span>
                  <span className="text-caption text-emerald-600 font-medium block">Included in Plan</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300 space-y-3">
                <Phone className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">No Caller ID Configured</p>
                  <p className="text-caption text-slate-500 max-w-md mx-auto mt-1">
                    Your account does not have a verified telephony caller ID number allocated yet. Request an
                    instant TRAI-compliant local DID number to start automated outbound calling.
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsNumberModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Select & Assign Verified Caller ID
                </Button>
              </div>
            )}
          </div>

          {/* Outbound Calling Hours & Schedule */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs max-w-2xl">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Calling Hours & Schedule Policy</h4>
            <p className="text-caption text-slate-500 mb-4">
              Configure daily allowed automated outbound calling hours per TRAI consumer regulations.
            </p>

            <form onSubmit={handleSaveCallingSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Start Hour</label>
                  <select
                    value={callingSettings.startHour}
                    onChange={(e) =>
                      setCallingSettings({ ...callingSettings, startHour: Number(e.target.value) })
                    }
                    className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-hidden focus:border-blue-500 text-slate-900 bg-white"
                  >
                    {[8, 9, 10, 11].map((h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, '0')}:00 AM (IST)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily End Hour</label>
                  <select
                    value={callingSettings.endHour}
                    onChange={(e) =>
                      setCallingSettings({ ...callingSettings, endHour: Number(e.target.value) })
                    }
                    className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-hidden focus:border-blue-500 text-slate-900 bg-white"
                  >
                    {[18, 19, 20, 21].map((h) => (
                      <option key={h} value={h}>
                        {h > 12 ? h - 12 : h}:00 PM (IST)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Automated Calling Engine</span>
                  <span className="text-caption text-slate-500 block">
                    Enable or pause outbound AI voice agent call dispatching across your CRM leads.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCallingSettings((prev) => ({
                      ...prev,
                      isAutomatedCallingEnabled: !prev.isAutomatedCallingEnabled,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    callingSettings.isAutomatedCallingEnabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      callingSettings.isAutomatedCallingEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <Button type="submit" size="sm" isLoading={isSavingSettings}>
                  Save Schedule Policy
                </Button>
              </div>
            </form>
          </div>
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

      {/* Request / Allocate Phone Number Modal */}
      <Modal
        isOpen={isNumberModalOpen}
        onClose={() => setIsNumberModalOpen(false)}
        title="Request Verified Caller ID Number"
        maxWidth="md"
      >
        <form onSubmit={handleRequestNumber} className="space-y-4 text-xs p-4 sm:p-6">
          <p className="text-caption text-slate-600">
            Select a verified Indian telecom circle number from the available inventory. Numbers are pre-approved
            for natural AI voice outbound calling.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Available Inventory Numbers <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {phoneData?.available && phoneData.available.length > 0 ? (
                phoneData.available.map((n) => (
                  <label
                    key={n.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                      selectedNumberId === n.id
                        ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="numberId"
                        value={n.id}
                        checked={selectedNumberId === n.id}
                        onChange={() => setSelectedNumberId(n.id)}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="font-mono text-xs block">{n.number}</span>
                        <span className="text-caption text-slate-400 font-normal">{n.region}</span>
                      </div>
                    </div>
                    <span className="text-micro font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Available
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-caption text-slate-500 p-2 text-center">No inventory numbers available.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Signatory Name"
                required
                value={kycSignatory}
                onChange={(e) => setKycSignatory(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Company GSTIN"
                required
                value={kycGstin}
                onChange={(e) => setKycGstin(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNumberModalOpen(false)}
              disabled={isRequestingNumber}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isRequestingNumber}>
              Allocate Caller ID
            </Button>
          </div>
        </form>
      </Modal>

      {/* Release Number Confirmation Modal */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Release Phone Number"
        maxWidth="sm"
      >
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-red-900">Release Assigned Caller ID?</p>
              <p className="text-caption text-red-700 mt-1">
                Are you sure you want to release <strong>{phoneData?.assigned?.number}</strong>? Outbound calling
                will be suspended until a new number is configured.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReleaseModalOpen(false)}
              disabled={isReleasingNumber}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReleaseNumber}
              isLoading={isReleasingNumber}
            >
              Release Number
            </Button>
          </div>
        </div>
      </Modal>

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
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition ${
                  topUpAmount === amt
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
