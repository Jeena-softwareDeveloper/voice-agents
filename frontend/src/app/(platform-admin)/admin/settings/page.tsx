'use client';

import React, { useEffect, useState } from 'react';
import { settingsApi } from '@/features/settings/api/settings.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { StatusBadge } from '@/components/common/badges/StatusBadge';
import { TelephonyNumber, SarvamApiAuditLog } from '@/types';
import {
  Sparkles,
  Phone,
  Clock,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
  Plus,
  Radio,
  Server,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [data, setData] = useState<any>(null);
  const [numbers, setNumbers] = useState<TelephonyNumber[]>([]);
  const [logs, setLogs] = useState<SarvamApiAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Add Number Modal State
  const [isAddNumberOpen, setIsAddNumberOpen] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newRegion, setNewRegion] = useState('Pune Circle (020)');
  const [newType, setNewType] = useState<'DID_LOCAL' | 'TOLL_FREE' | 'MOBILE_VIRTUAL'>('DID_LOCAL');
  const [newRent, setNewRent] = useState(499);
  const [isAddingNumber, setIsAddingNumber] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, numbersRes, logsRes] = await Promise.all([
        settingsApi.getPlatformSettings(),
        settingsApi.getAllTelephonyNumbers(),
        settingsApi.getSarvamLogs(),
      ]);
      setData(settingsRes);
      setNumbers(numbersRes);
      setLogs(logsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await settingsApi.testSarvamConnection();
      setTestResult(res);
      const updatedLogs = await settingsApi.getSarvamLogs();
      setLogs(updatedLogs);
    } catch (err: any) {
      setTestResult({ status: 'DISCONNECTED', error: err.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await settingsApi.updatePlatformSettings({
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

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    setIsAddingNumber(true);
    try {
      await settingsApi.addTelephonyNumber({
        number: newNumber.trim(),
        region: newRegion,
        type: newType,
        monthlyRent: Number(newRent),
      });
      setIsAddNumberOpen(false);
      setNewNumber('');
      const updatedNumbers = await settingsApi.getAllTelephonyNumbers();
      setNumbers(updatedNumbers);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNumber(false);
    }
  };

  const handleReleaseNumber = async (numberId: string) => {
    try {
      await settingsApi.releaseNumber(numberId);
      const updatedNumbers = await settingsApi.getAllTelephonyNumbers();
      setNumbers(updatedNumbers);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading Platform Configurations..." className="py-20" />;
  }

  const providerCost = 0.95;
  const clientSellingPrice = Number(data.pricing.aiMinuteRateInr || 1.8);
  const marginInr = clientSellingPrice - providerCost;
  const marginPercent = ((marginInr / clientSellingPrice) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central Sarvam AI & Telephony Settings"
        description="Unified Super Admin controls for the platform-owned Sarvam AI voice provider, carrier telephony trunk, caller ID provisioning, and client rate cards."
      />

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings updated successfully across all tenant workspaces.
        </div>
      )}

      {/* 1. Sarvam AI Provider Connection Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              1. Central Sarvam AI Provider Connection
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Platform owns and funds this master integration. Client workspaces never need their own Sarvam credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                data.aiProvider.status === 'CONNECTED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
              {data.aiProvider.status} ({data.aiProvider.latencyMs || 42}ms)
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={handleTestConnection}
              isLoading={isTesting}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Test Sarvam Connection
            </Button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
              testResult.status === 'CONNECTED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.status === 'CONNECTED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                <strong>Sarvam API Status:</strong> {testResult.status} • Latency: {testResult.latencyMs}ms • Active Engine: {testResult.activeModel || 'Sarvam Voice Agents (Saaras v4 + Bulbul V4)'}
              </span>
            </div>
            {testResult.availableCredits !== undefined && (
              <span className="font-semibold">
                Available Credits: ₹{testResult.availableCredits.toFixed(2)}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Managed Voice Runtime"
            value={data.aiProvider.runtimeEndpoint || 'Official Sarvam App Runtime (apps.sarvam.ai)'}
            disabled
            helperText="Direct full-duplex Sarvam Voice Agents engine"
          />

          <Input
            label="Live Master API Credential Key"
            value={data.aiProvider.apiKeyMasked}
            disabled
            helperText="Encrypted & stored in secure backend environment."
          />

          <div className="flex flex-col justify-end">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-caption font-semibold text-slate-500 block uppercase">
                Platform Sarvam Balance
              </span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                ₹{Number(data.aiProvider.balanceRemaining || 14850.75).toLocaleString()}
              </p>
              <span className="text-micro text-emerald-600 font-medium">Automatic prepaid auto-reload enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Platform Pricing & Rate Cards (Margin Calculator) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          2. Platform Pricing, Minute Rates & Gross Margin
        </h3>
        <p className="text-xs text-slate-500">
          Our platform pays Sarvam the wholesale provider rate and charges clients the configured selling price.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Sarvam Provider Cost</span>
            <p className="text-xl font-bold text-slate-800 mt-1">₹{providerCost.toFixed(2)} / min</p>
            <span className="text-caption text-slate-400">Fixed Indic Voice TTS+STT</span>
          </div>

          <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-200">
            <span className="text-xs text-blue-700 font-medium block">Client Selling Price</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-bold text-slate-700">₹</span>
              <input
                type="number"
                step="0.05"
                value={data.pricing.aiMinuteRateInr}
                onChange={(e) =>
                  setData({
                    ...data,
                    pricing: { ...data.pricing, aiMinuteRateInr: Number(e.target.value) },
                  })
                }
                className="w-24 text-lg font-bold text-blue-900 bg-white border border-blue-300 rounded px-2 py-0.5"
              />
              <span className="text-xs text-slate-500">/ min</span>
            </div>
            <span className="text-caption text-blue-600">Billed to tenant ledger</span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200">
            <span className="text-xs text-emerald-700 font-medium block">Platform Profit Margin</span>
            <p className="text-xl font-bold text-emerald-800 mt-1">₹{marginInr.toFixed(2)} / min</p>
            <span className="text-caption text-emerald-700 font-bold">{marginPercent}% gross margin</span>
          </div>

          <div className="p-3.5 bg-purple-50/50 rounded-lg border border-purple-200">
            <span className="text-xs text-purple-700 font-medium block">DID Number Rental</span>
            <p className="text-xl font-bold text-purple-900 mt-1">₹499 / mo</p>
            <span className="text-caption text-purple-600">Local Indian city circle</span>
          </div>
        </div>
      </div>

      {/* 3. Central Telephony Trunk & Number Pool Inventory */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" />
              3. Telephony Numbers & Trunk Inventory ({numbers.length} Managed)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Centrally provisioned carrier numbers from Sarvam Telephony Trunk and BYOT accounts.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddNumberOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Provisioned Number
          </Button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-caption border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Caller ID Number</th>
                <th className="px-3 py-2.5">Circle / Region</th>
                <th className="px-3 py-2.5">Number Type</th>
                <th className="px-3 py-2.5">Monthly Rent</th>
                <th className="px-3 py-2.5">KYC Status</th>
                <th className="px-3 py-2.5">Allocation Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {numbers.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{n.number}</td>
                  <td className="px-3 py-2.5 text-slate-700">{n.region}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-caption font-semibold">
                      {n.type === 'DID_LOCAL'
                        ? 'Local DID'
                        : n.type === 'TOLL_FREE'
                        ? 'Toll-Free (1800)'
                        : 'Virtual Mobile'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">₹{n.monthlyRent} / mo</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-caption font-semibold ${
                        n.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {n.kycStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {n.status === 'ASSIGNED' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Assigned ({n.assignedTenantId ? `Tenant: ${n.assignedTenantId.replace('tenant-', '')}` : 'Active Client'})
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Available for Allocation</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {n.status === 'ASSIGNED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReleaseNumber(n.id)}
                        className="text-xs h-7 text-rose-600 hover:text-rose-700"
                      >
                        Release Number
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Global TRAI Calling Rules */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          4. Global AI Calling Rules (TRAI Regulatory Compliance)
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
            helperText="Default 09:00 AM"
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
            helperText="Default 20:00 PM (TRAI limit)"
          />
          <Input
            label="Platform Maximum Concurrency Limit"
            type="number"
            value={String(data.callingRules.concurrencyLimit)}
            onChange={(e) =>
              setData({
                ...data,
                callingRules: { ...data.callingRules, concurrencyLimit: Number(e.target.value) },
              })
            }
            helperText="Max simultaneous outbound calls"
          />
        </div>
      </div>

      {/* 5. Provider Request Logs & Health Monitoring */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-700" />
            5. Sarvam Provider API Request Telemetry & Latencies
          </h3>
          <span className="text-xs text-slate-500 font-medium">{logs.length} recent requests tracked</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-caption border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Endpoint</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Latency</th>
                <th className="px-3 py-2">Request ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 font-mono text-caption">
                  <td className="px-3 py-2 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{log.endpoint}</td>
                  <td className="px-3 py-2 text-slate-600">{log.method}</td>
                  <td className="px-3 py-2">
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                      {log.statusCode} OK
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-700 font-bold">{log.latencyMs}ms</td>
                  <td className="px-3 py-2 text-slate-400">{log.requestId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={handleSave} isLoading={isSaving} size="md">
          Save Central Platform Configurations
        </Button>
      </div>

      {/* Add Number Modal */}
      {isAddNumberOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Provision New Carrier Phone Number</h3>
              <button onClick={() => setIsAddNumberOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNumber} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verified Phone Number (E.164 format)
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 22 6988 1122"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telecom Circle / Region</label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Pune Circle (020)">Pune Circle (020)</option>
                  <option value="Mumbai Circle (022)">Mumbai Circle (022)</option>
                  <option value="Delhi NCR Circle (011)">Delhi NCR Circle (011)</option>
                  <option value="Bangalore Circle (080)">Bangalore Circle (080)</option>
                  <option value="Hyderabad Circle (040)">Hyderabad Circle (040)</option>
                  <option value="National Toll-Free (1800)">National Toll-Free (1800)</option>
                  <option value="National Virtual Mobile">National Virtual Mobile</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="DID_LOCAL">Local DID</option>
                    <option value="TOLL_FREE">Toll-Free (1800)</option>
                    <option value="MOBILE_VIRTUAL">Virtual Mobile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    value={newRent}
                    onChange={(e) => setNewRent(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsAddNumberOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAddingNumber}>
                  Save to Inventory
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
