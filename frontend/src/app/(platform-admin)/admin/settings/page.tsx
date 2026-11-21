'use client';

import React, { useEffect, useState } from 'react';
import { settingsApi } from '@/features/settings/api/settings.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { Select } from '@/components/common/dropdowns/Select';
import { Sparkles, Phone, Clock, IndianRupee, ShieldCheck } from 'lucide-react';

export default function AdminSettingsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    settingsApi
      .getPlatformSettings()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await settingsApi.updatePlatformSettings({
        sarvamApiBaseUrl: data.aiProvider.baseUrl,
        aiMinutePricing: data.pricing.aiMinuteRateInr,
        telephonyPricing: data.pricing.telephonyMinuteRateInr,
        defaultCallingStartHour: data.callingRules.defaultStartHour,
        defaultCallingEndHour: data.callingRules.defaultEndHour,
      });
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading Global Settings..." className="py-20" />;
  }

  return (
    <div>
      <PageHeader
        title="Global Platform Settings"
        description="Unified configuration for Sarvam AI voice provider, telephony trunk routing, default calling rules, and pricing rate cards."
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
            Settings updated successfully across all tenant clusters.
          </div>
        )}

        {/* 1. AI Provider Settings (Sarvam AI) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" /> 1. Sarvam AI Provider Connection
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              {data.aiProvider.status} (Balance: ₹{data.aiProvider.balanceRemaining})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Sarvam API Base Endpoint"
              value={data.aiProvider.baseUrl}
              onChange={(e) =>
                setData({
                  ...data,
                  aiProvider: { ...data.aiProvider, baseUrl: e.target.value },
                })
              }
            />
            <Input
              label="Live API Credential Key"
              value={data.aiProvider.apiKeyMasked}
              disabled
              helperText="Managed centrally. Contact platform security officer to rotate."
            />
          </div>
        </div>

        {/* 2. Telephony Trunk Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-purple-600" /> 2. Telephony Trunk & Managed Numbers
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Active managed caller IDs automatically rotated across outbound campaign dispatches:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {data.telephony.managedNumbers.map((n: any) => (
              <div key={n.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <span className="text-xs font-mono font-semibold text-slate-800">{n.number}</span>
                <span className="block text-[10px] text-emerald-600 font-medium">Verified Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Global AI Calling Rules */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> 3. Global AI Calling Rules (TRAI Compliant)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Calling Window Start (Hour 24h)"
              type="number"
              value={String(data.callingRules.defaultStartHour)}
              onChange={(e) =>
                setData({
                  ...data,
                  callingRules: { ...data.callingRules, defaultStartHour: Number(e.target.value) },
                })
              }
            />
            <Input
              label="Calling Window End (Hour 24h)"
              type="number"
              value={String(data.callingRules.defaultEndHour)}
              onChange={(e) =>
                setData({
                  ...data,
                  callingRules: { ...data.callingRules, defaultEndHour: Number(e.target.value) },
                })
              }
            />
            <Input
              label="Platform Concurrency Limit"
              type="number"
              value={String(data.callingRules.concurrencyLimit)}
              onChange={(e) =>
                setData({
                  ...data,
                  callingRules: { ...data.callingRules, concurrencyLimit: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>

        {/* 4. Pricing Configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-600" /> 4. Pricing & Minute Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="AI Minute Price to Tenant (₹ / min)"
              type="number"
              step="0.05"
              value={String(data.pricing.aiMinuteRateInr)}
              onChange={(e) =>
                setData({
                  ...data,
                  pricing: { ...data.pricing, aiMinuteRateInr: Number(e.target.value) },
                })
              }
            />
            <Input
              label="Telephony Minute Cost (₹ / min)"
              type="number"
              step="0.05"
              value={String(data.pricing.telephonyMinuteRateInr)}
              onChange={(e) =>
                setData({
                  ...data,
                  pricing: { ...data.pricing, telephonyMinuteRateInr: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>

        <Button type="submit" isLoading={isSaving}>
          Save Global Configurations
        </Button>
      </form>
    </div>
  );
}
