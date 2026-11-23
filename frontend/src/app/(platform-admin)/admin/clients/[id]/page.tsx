'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsApi } from '@/features/clients/api/clients.api';
import { settingsApi } from '@/features/settings/api/settings.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { TelephonyNumber } from '@/types';
import {
  Building2,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  CreditCard,
  Phone,
  Sparkles,
  Sliders,
  Plus,
} from 'lucide-react';

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [telephonyNumbers, setTelephonyNumbers] = useState<TelephonyNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingQuota, setIsSavingQuota] = useState(false);
  const [quotaSavedMessage, setQuotaSavedMessage] = useState(false);

  // Quota Controls Form State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [monthlyLimit, setMonthlyLimit] = useState(2000);
  const [dailyLimit, setDailyLimit] = useState(200);
  const [concurrency, setConcurrency] = useState(10);
  const [selectedNumberId, setSelectedNumberId] = useState('');
  const [creditAdjustment, setCreditAdjustment] = useState<number>(0);

  useEffect(() => {
    loadAll();
  }, [clientId]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [clientRes, numbersRes] = await Promise.all([
        clientsApi.getById(clientId),
        settingsApi.getAllTelephonyNumbers(),
      ]);
      setClient(clientRes);
      setTelephonyNumbers(numbersRes);

      setAiEnabled(clientRes.aiCallingEnabled ?? true);
      setMonthlyLimit(clientRes.monthlyCallingLimit || 2000);
      setDailyLimit(clientRes.dailyCallingLimit || 200);
      setConcurrency(clientRes.concurrencyLimit || 10);

      const assigned = numbersRes.find((n) => n.assignedTenantId === clientId);
      if (assigned) {
        setSelectedNumberId(assigned.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (status: 'ACTIVE' | 'SUSPENDED') => {
    setIsUpdating(true);
    try {
      await clientsApi.updateStatus(clientId, status, client.aiCallingEnabled, client.monthlyCallingLimit);
      await loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuota(true);
    setQuotaSavedMessage(false);

    try {
      await settingsApi.updateClientAiQuota(clientId, {
        aiCallingEnabled: aiEnabled,
        monthlyCallingLimit: Number(monthlyLimit),
        dailyCallingLimit: Number(dailyLimit),
        concurrencyLimit: Number(concurrency),
        assignedNumberId: selectedNumberId || undefined,
        creditAdjustment: Number(creditAdjustment) || 0,
      });

      setCreditAdjustment(0);
      setQuotaSavedMessage(true);
      await loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingQuota(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading client details..." className="py-20" />;
  }

  if (!client) {
    return <div className="p-8 text-center text-slate-500">Client organization not found.</div>;
  }

  const assignedNumber = telephonyNumbers.find((n) => n.assignedTenantId === clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={`Tenant ID: ${client.id} • Registered: ${new Date(client.createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Clients', href: '/admin/clients' },
          { label: client.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {client.status === 'ACTIVE' ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleStatusChange('SUSPENDED')}
                isLoading={isUpdating}
              >
                Suspend Account
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleStatusChange('ACTIVE')}
                isLoading={isUpdating}
              >
                Activate Account
              </Button>
            )}
          </div>
        }
      />

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Account Status</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                client.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {client.status}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">AI Calling Status</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                client.aiCallingEnabled
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {client.aiCallingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Available Credits</p>
          <p className="text-lg font-bold text-emerald-800 mt-0.5">
            ₹{Number(client.creditBalance ?? 450).toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Assigned Caller ID</p>
          <p className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">
            {assignedNumber ? assignedNumber.number : 'None Provisioned'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Used Minutes</p>
          <p className="text-lg font-bold text-purple-700 mt-0.5">
            {Number(client.usedCallingMinutes || 0).toFixed(1)} / {client.monthlyCallingLimit} m
          </p>
        </div>
      </div>

      {/* Main Content: AI Service Allocation & Business Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client AI Service Allocation & Limits (SUPER ADMIN CONTROL) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                AI Calling Service Allocation & Quotas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Super Admin limits, caller ID mapping, and credit adjustments for this tenant.
              </p>
            </div>
          </div>

          {quotaSavedMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              AI service allocation updated successfully.
            </div>
          )}

          <form onSubmit={handleSaveQuota} className="space-y-4">
            {/* 1. Toggle AI Calling */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">AI Voice Calling Service</span>
                <span className="text-caption text-slate-500">Allow tenant leads to be reached via Sarvam AI voice agent</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 2. Assign Caller Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Carrier Phone Number
              </label>
              <select
                value={selectedNumberId}
                onChange={(e) => setSelectedNumberId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-mono"
              >
                <option value="">-- No number assigned (Calling Disabled) --</option>
                {telephonyNumbers.map((n) => (
                  <option
                    key={n.id}
                    value={n.id}
                    disabled={n.status === 'ASSIGNED' && n.assignedTenantId !== clientId}
                  >
                    {n.number} ({n.region} - ₹{n.monthlyRent}/mo) {n.assignedTenantId === clientId ? '✓ Currently Assigned' : n.status === 'ASSIGNED' ? '(Assigned to another tenant)' : '(Available)'}
                  </option>
                ))}
              </select>
              <span className="text-caption text-slate-400 mt-0.5 block">
                Caller ID shown on customer mobile devices during automated calls.
              </span>
            </div>

            {/* 3. Calling Limits Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1">Monthly Limit (mins)</label>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1">Daily Limit (calls)</label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1">Concurrency Limit</label>
                <input
                  type="number"
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* 4. Credit Balance Adjustment */}
            <div className="p-3.5 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900">Credit Balance Adjustment</span>
                <span className="text-xs font-bold text-emerald-700">
                  Current: ₹{Number(client.creditBalance ?? 450).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="50"
                  placeholder="+Add credits (e.g. 500)"
                  value={creditAdjustment || ''}
                  onChange={(e) => setCreditAdjustment(Number(e.target.value))}
                  className="flex-1 text-xs px-3 py-1.5 rounded border border-emerald-300 bg-white"
                />
                <span className="text-xs text-slate-500">₹</span>
              </div>
              <span className="text-micro text-slate-500 block mt-1">
                Enter positive value to add bonus/purchased credits, or negative to deduct.
              </span>
            </div>

            <Button type="submit" isLoading={isSavingQuota} className="w-full justify-center">
              Save AI Service Allocation
            </Button>
          </form>
        </div>

        {/* Company & Business Profile */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> Business Profile & Onboarding Answers
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Business Email</dt>
                <dd className="font-semibold text-slate-800">{client.email}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Contact Phone</dt>
                <dd className="font-semibold text-slate-800">{client.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Industry / Business Type</dt>
                <dd className="font-semibold text-slate-800">{client.businessType}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Operating Location</dt>
                <dd className="font-semibold text-slate-800">
                  {client.city}, {client.state}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400 font-medium">Primary Objective</dt>
                <dd className="font-normal text-slate-700 mt-0.5">
                  {client.businessProfile?.primaryObjective ||
                    'Automate inbound lead qualification and schedule on-site visits via Sarvam AI voice.'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Registered Services & AI Conversation Mapping */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" /> Registered Service Categories ({client.services?.length || 0})
            </h3>
            <div className="space-y-2.5">
              {client.services?.length ? (
                client.services.map((service: any) => (
                  <div
                    key={service.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{service.name}</h4>
                      <p className="text-caption text-slate-500">{service.category}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-micro font-bold ${
                          service.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {service.approvalStatus}
                      </span>
                      <p className="text-micro text-slate-400 mt-0.5">{service._count?.leads || 0} leads</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No services created yet by this client.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
