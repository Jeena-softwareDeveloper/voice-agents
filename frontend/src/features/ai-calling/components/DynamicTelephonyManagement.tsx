'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  Globe,
  Building2,
  Server,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Plus,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Clock,
  Search,
  Filter,
  Layers,
  Bot,
  Info,
  X,
  ChevronRight,
  Check,
  CreditCard,
  Cpu,
} from 'lucide-react';
import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';
import { aiCallingApi } from '../api/ai-calling.api';
import {
  TelephonyConnection,
  TelephonyNumber,
  NumberCatalogResult,
  NumberCatalogItem,
  Service,
} from '@/types';
import { Button } from '@/components/common/buttons/Button';
import { Modal } from '@/components/common/modals/Modal';
import { useToast } from '@/components/common/feedback/Toast';
import { DropdownSelect } from '@/components/common/dropdowns/DropdownSelect';

interface DynamicTelephonyManagementProps {
  services?: Service[];
  onRefreshOverview?: () => void;
}

export const DynamicTelephonyManagement: React.FC<DynamicTelephonyManagementProps> = ({
  services = [],
  onRefreshOverview,
}) => {
  const { success, error: toastError } = useToast();

  // Data States
  const [connections, setConnections] = useState<TelephonyConnection[]>([]);
  const [numbers, setNumbers] = useState<TelephonyNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingConnId, setRefreshingConnId] = useState<string | null>(null);

  // Catalog Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalog, setCatalog] = useState<NumberCatalogResult | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCountry, setCatalogCountry] = useState('');
  const [catalogType, setCatalogType] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<NumberCatalogItem | null>(null);

  // Connect BYOT Number Modal State
  const [isByotModalOpen, setIsByotModalOpen] = useState(false);
  const [byotForm, setByotForm] = useState({
    e164Number: '',
    carrierName: 'Twilio SIP Trunk',
    sipTrunkHost: 'sip.carrier.com',
    accountSid: '',
    region: '',
    signatoryName: 'Authorized Admin',
  });
  const [isSubmittingByot, setIsSubmittingByot] = useState(false);

  // Add Connection Modal State
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [connForm, setConnForm] = useState({
    name: 'Primary SIP Trunk',
    providerType: 'BYOT_SIP_TRUNK' as const,
    carrierName: 'Twilio SIP Trunk',
    sipTrunkHost: 'sip.carrier.com',
    accountSid: '',
  });
  const [isSubmittingConn, setIsSubmittingConn] = useState(false);

  // Assign Number Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedNumberForAssign, setSelectedNumberForAssign] = useState<TelephonyNumber | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Release Number Confirmation Modal State
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedNumberForRelease, setSelectedNumberForRelease] = useState<TelephonyNumber | null>(null);
  const [usageDetails, setUsageDetails] = useState<{ inUse: boolean; activeDeployments: string[] } | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [confirmForceRelease, setConfirmForceRelease] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  // Details Modal State
  const [selectedNumberForDetails, setSelectedNumberForDetails] = useState<TelephonyNumber | null>(null);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [connsRes, numbersRes] = await Promise.all([
        aiCallingApi.getConnections().catch(() => []),
        aiCallingApi.getTenantNumbers().catch(() => []),
      ]);
      setConnections(connsRes || []);
      setNumbers(numbersRes || []);
    } catch (err: any) {
      toastError('Failed to load telephony data', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-verify a connection
  const handleRefreshConnection = async (connId: string) => {
    setRefreshingConnId(connId);
    try {
      await aiCallingApi.refreshConnection(connId);
      success('Connection Verified', 'Telephony provider connection verified successfully.');
      loadAllData();
    } catch (err: any) {
      toastError('Verification Failed', err.response?.data?.message || err.message);
    } finally {
      setRefreshingConnId(null);
    }
  };

  // Load Catalog
  const handleOpenCatalog = async () => {
    setIsCatalogModalOpen(true);
    setIsLoadingCatalog(true);
    try {
      const cat = await aiCallingApi.getNumberCatalog({
        countryCode: catalogCountry || undefined,
        numberType: catalogType || undefined,
        search: catalogSearch || undefined,
      });
      setCatalog(cat);
    } catch (err: any) {
      toastError('Catalog Error', err?.response?.data?.message || err?.message);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Filter Catalog
  const handleFilterCatalog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoadingCatalog(true);
    try {
      const cat = await aiCallingApi.getNumberCatalog({
        countryCode: catalogCountry || undefined,
        numberType: catalogType || undefined,
        search: catalogSearch || undefined,
      });
      setCatalog(cat);
    } catch (err: any) {
      toastError('Filter Error', err?.response?.data?.message || err?.message);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Purchase / Rent Number from Sarvam Catalog
  const handlePurchaseCatalogNumber = async () => {
    if (!selectedCatalogItem) return;
    setIsPurchasing(true);
    try {
      await aiCallingApi.purchaseCatalogNumber({
        providerNumberId: selectedCatalogItem.providerNumberId,
        businessKyc: {
          authorizedSignatoryName: 'Authorized Admin',
        },
      });
      success(
        'Phone Number Purchased',
        `Successfully purchased and activated ${selectedCatalogItem.e164Number} (${selectedCatalogItem.region}) via Sarvam Managed Telephony.`,
      );
      setIsCatalogModalOpen(false);
      setSelectedCatalogItem(null);
      await loadAllData();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err: any) {
      toastError('Purchase Failed', err?.response?.data?.message || err?.message || 'Could not purchase number');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Register BYOT Number
  const handleSubmitByot = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = byotForm.e164Number.trim();
    if (!raw) return;

    if (!isValidPhoneNumber(raw)) {
      toastError(
        'Invalid Phone Number',
        'Please enter a valid international phone number in E.164 format (e.g. +1 415 555 2671, +44 20 7183 8750).',
      );
      return;
    }

    setIsSubmittingByot(true);
    try {
      await aiCallingApi.registerByotNumber({
        e164Number: raw,
        carrierName: byotForm.carrierName,
        sipTrunkHost: byotForm.sipTrunkHost,
        accountSid: byotForm.accountSid || undefined,
        region: byotForm.region || undefined,
        businessKyc: byotForm.signatoryName
          ? { authorizedSignatoryName: byotForm.signatoryName }
          : undefined,
      });
      success('BYOT Number Connected', `Successfully connected and verified caller ID: ${raw}`);
      setIsByotModalOpen(false);
      setByotForm({
        e164Number: '',
        carrierName: 'Twilio SIP Trunk',
        sipTrunkHost: 'sip.carrier.com',
        accountSid: '',
        region: '',
        signatoryName: 'Authorized Admin',
      });
      loadAllData();
    } catch (err: any) {
      toastError('BYOT Registration Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmittingByot(false);
    }
  };

  // Add Telephony Connection
  const handleSubmitConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingConn(true);
    try {
      await aiCallingApi.addConnection({
        name: connForm.name,
        providerType: connForm.providerType,
        carrierName: connForm.carrierName,
        sipTrunkHost: connForm.sipTrunkHost,
        accountSid: connForm.accountSid || undefined,
      });
      success('Connection Added', `Telephony connection "${connForm.name}" created and verified.`);
      setIsConnModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toastError('Connection Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmittingConn(false);
    }
  };

  // Open Release Modal with Usage Check
  const handleOpenReleaseModal = async (num: TelephonyNumber) => {
    setSelectedNumberForRelease(num);
    setConfirmForceRelease(false);
    setIsReleaseModalOpen(true);
    setIsCheckingUsage(true);
    try {
      const usage = await aiCallingApi.checkNumberUsage(num.id);
      setUsageDetails(usage);
    } catch {
      setUsageDetails({ inUse: false, activeDeployments: [] });
    } finally {
      setIsCheckingUsage(false);
    }
  };

  // Confirm Release
  const handleConfirmRelease = async () => {
    if (!selectedNumberForRelease) return;
    setIsReleasing(true);
    try {
      await aiCallingApi.releaseNumber(selectedNumberForRelease.id, confirmForceRelease);
      success('Number Released', `Caller ID ${selectedNumberForRelease.e164Number} was released.`);
      setIsReleaseModalOpen(false);
      setSelectedNumberForRelease(null);
      loadAllData();
    } catch (err: any) {
      toastError('Release Failed', err.response?.data?.message || err.message);
    } finally {
      setIsReleasing(false);
    }
  };

  // Assign Number to Service
  const handleAssignNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNumberForAssign) return;

    setIsAssigning(true);
    try {
      const targetSvc = services.find((s) => s.id === selectedServiceId);
      await aiCallingApi.assignNumber(selectedNumberForAssign.id, {
        agentId: selectedServiceId || undefined,
        serviceName: targetSvc?.name || 'General Inbound/Outbound',
      });
      success('Number Assigned', `Caller ID assigned to ${targetSvc?.name || 'General service'}.`);
      setIsAssignModalOpen(false);
      setSelectedNumberForAssign(null);
      loadAllData();
    } catch (err: any) {
      toastError('Assignment Failed', err.response?.data?.message || err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  // Real-time E.164 parsing preview for BYOT input
  let parsedByotMeta: {
    isValid: boolean;
    countryCode?: string;
    callingCode?: string;
    formatted?: string;
    type?: string;
  } | null = null;

  if (byotForm.e164Number.trim()) {
    try {
      const isValid = isValidPhoneNumber(byotForm.e164Number.trim());
      if (isValid) {
        const p = parsePhoneNumber(byotForm.e164Number.trim());
        if (p) {
          parsedByotMeta = {
            isValid: true,
            countryCode: p.country,
            callingCode: `+${p.countryCallingCode}`,
            formatted: p.formatInternational(),
            type: p.getType() || 'LOCAL',
          };
        }
      } else {
        parsedByotMeta = { isValid: false };
      }
    } catch {
      parsedByotMeta = { isValid: false };
    }
  }

  return (
    <div className="space-y-6">


      {/* ===================================================================== */}
      {/* SECTION 2: Active Caller IDs                                          */}
      {/* ===================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Active Caller IDs & Phone Numbers
              </h3>
            </div>
            <p className="text-caption text-slate-500 mt-0.5">
              Verified phone numbers assigned to your organization for outbound and inbound AI calling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAllData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCatalog}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buy a phone number</span>
            </button>

            <button
              type="button"
              onClick={() => setIsByotModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            >
              <span>Connect BYOT Number</span>
            </button>
          </div>
        </div>

        {/* Numbers Table / Cards */}
        {numbers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">No Active Caller IDs Assigned</h4>
              <p className="text-caption text-slate-500 max-w-md mx-auto mt-1">
                You do not have any phone numbers assigned yet. Connect your carrier number with Bring Your Own Telephony (BYOT) or browse verified provider numbers.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsByotModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-2xs"
              >
                Connect BYOT Number
              </button>
              <button
                type="button"
                onClick={handleOpenCatalog}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Browse Catalog
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-caption tracking-wider">
                  <th className="py-3 px-3">Phone Number</th>
                  <th className="py-3 px-3">Country / Region</th>
                  <th className="py-3 px-3">Number Type</th>
                  <th className="py-3 px-3">Provider Connection</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Service</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {numbers.map((num) => (
                  <tr key={num.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {num.e164Number}
                        </span>
                        {num.isByot && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded">
                            BYOT
                          </span>
                        )}
                      </div>
                      <span className="text-caption text-slate-400 block mt-0.5">
                        Calling Code: {num.callingCode || 'E.164'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">{num.countryName}</span>
                      </div>
                      <span className="text-caption text-slate-400 block pl-5">{num.region}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {num.numberType}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-700 block">{num.provider}</span>
                      <span className="text-caption text-slate-400">
                        {num.connectionName || 'Default Trunk'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          num.providerStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : num.providerStatus === 'PENDING_VERIFICATION'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            num.providerStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{num.providerStatus}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {num.assignedServiceName ? (
                        <div className="flex items-center gap-1 text-blue-700 font-semibold">
                          <Bot className="w-3.5 h-3.5" />
                          <span>{num.assignedServiceName}</span>
                        </div>
                      ) : (
                        <span className="text-caption text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedNumberForDetails(num)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNumberForAssign(num);
                            setSelectedServiceId(num.assignedAgentId || (services[0]?.id || ''));
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition"
                        >
                          Assign
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReleaseModal(num)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                          title="Release number"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: Connect Bring Your Own Telephony (BYOT) Number                */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isByotModalOpen}
        onClose={() => setIsByotModalOpen(false)}
        title="Connect Bring Your Own Telephony (BYOT) Number"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitByot} className="space-y-4 p-5 text-xs">
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-blue-900 space-y-1">
            <span className="font-bold block">International E.164 Telephony Standard</span>
            <p className="text-caption text-blue-800">
              Enter your carrier-assigned phone number including the country code (e.g. +1 415 555 2671 for US, +44 20 7183 8750 for UK, +91 98220 11223 for IN). The system automatically parses country and calling routing.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">Phone Number (E.164 format) *</label>
            <input
              type="tel"
              value={byotForm.e164Number}
              onChange={(e) => setByotForm({ ...byotForm, e164Number: e.target.value })}
              placeholder="+1 415 555 2671 or +44 20 7183 8750"
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-800 transition"
            />
            {/* Real-time Dynamic Format Detection */}
            {parsedByotMeta && (
              <div
                className={`p-2 rounded text-caption font-medium flex items-center justify-between ${
                  parsedByotMeta.isValid
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {parsedByotMeta.isValid ? (
                  <span>
                    ✅ Valid International Number: <strong>{parsedByotMeta.formatted}</strong> ({parsedByotMeta.countryCode} {parsedByotMeta.callingCode} • {parsedByotMeta.type})
                  </span>
                ) : (
                  <span>❌ Incomplete or invalid international phone number format.</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 block">Carrier / Trunk Name *</label>
              <input
                type="text"
                value={byotForm.carrierName}
                onChange={(e) => setByotForm({ ...byotForm, carrierName: e.target.value })}
                placeholder="e.g. Twilio, Tata Communications, Exotel, Plivo"
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 block">SIP Trunk Host / FQDN *</label>
              <input
                type="text"
                value={byotForm.sipTrunkHost}
                onChange={(e) => setByotForm({ ...byotForm, sipTrunkHost: e.target.value })}
                placeholder="e.g. sip.us1.twilio.com or sip.carrier.net"
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-800 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 block">Account SID / Identifier (Optional)</label>
              <input
                type="text"
                value={byotForm.accountSid}
                onChange={(e) => setByotForm({ ...byotForm, accountSid: e.target.value })}
                placeholder="e.g. ACxxxxxxxxxxxxxxxx"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-800 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 block">Geographic Region / City (Optional)</label>
              <input
                type="text"
                value={byotForm.region}
                onChange={(e) => setByotForm({ ...byotForm, region: e.target.value })}
                placeholder="e.g. San Francisco, London, Singapore"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 transition"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsByotModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingByot || !byotForm.e164Number.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
            >
              {isSubmittingByot ? 'Verifying & Connecting...' : 'Connect & Verify Number'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: Add Telephony Connection                                     */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isConnModalOpen}
        onClose={() => setIsConnModalOpen(false)}
        title="Add Telephony Trunk Connection"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitConnection} className="space-y-4 p-5 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">Connection Name *</label>
            <input
              type="text"
              value={connForm.name}
              onChange={(e) => setConnForm({ ...connForm, name: e.target.value })}
              placeholder="e.g. US West SIP Trunk, Tata Communications Gateway"
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">Carrier Provider Name *</label>
            <input
              type="text"
              value={connForm.carrierName}
              onChange={(e) => setConnForm({ ...connForm, carrierName: e.target.value })}
              placeholder="e.g. Twilio, Tata Communications, Exotel"
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">SIP Trunk Host / Gateway URI *</label>
            <input
              type="text"
              value={connForm.sipTrunkHost}
              onChange={(e) => setConnForm({ ...connForm, sipTrunkHost: e.target.value })}
              placeholder="e.g. sip.us1.twilio.com"
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-800 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">Account SID / API Credential (Optional)</label>
            <input
              type="text"
              value={connForm.accountSid}
              onChange={(e) => setConnForm({ ...connForm, accountSid: e.target.value })}
              placeholder="Account SID or authentication key"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-800 transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsConnModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingConn || !connForm.name.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
            >
              {isSubmittingConn ? 'Verifying...' : 'Save & Verify Connection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: Sarvam Buy a phone number Modal (Official UI)                 */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => {
          setIsCatalogModalOpen(false);
          setSelectedCatalogItem(null);
        }}
        title="Buy a phone number"
        description="Pick one number to buy. You can buy one at a time."
        maxWidth="lg"
      >
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Promotional Rate Banner */}
          <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-block bg-[#e6f4ea] text-[#137333] font-semibold text-[11px] px-2 py-0.5 rounded">
                Launch offer
              </span>
              <span className="font-bold text-slate-900 text-sm">₹59 / month</span>
              <span className="text-slate-400 line-through text-xs">₹159 / month</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Promotional rate — renewals revert to the standard price when it ends.
            </p>
            <p className="text-[11px] text-slate-500">
              If credits run short on the renewal date, the number is released and its campaigns and deployments are cancelled.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => {
                setCatalogSearch(e.target.value);
                // Instant client filtering
              }}
              placeholder="Search by number"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-full text-xs outline-none focus:border-slate-800 transition text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Numbers Table */}
          {isLoadingCatalog ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading available Sarvam numbers...</div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px] bg-slate-50/70">
                    <th className="py-2.5 px-4 w-10"></th>
                    <th className="py-2.5 px-3">Number</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalog?.items && catalog.items.length > 0 ? (
                    catalog.items
                      .filter((item) => {
                        if (!catalogSearch.trim()) return true;
                        const q = catalogSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return (
                          item.e164Number.replace(/[^0-9]/g, '').includes(q) ||
                          item.region?.toLowerCase().includes(catalogSearch.toLowerCase())
                        );
                      })
                      .map((item) => {
                        const isSelected = selectedCatalogItem?.providerNumberId === item.providerNumberId;
                        return (
                          <tr
                            key={item.providerNumberId}
                            onClick={() => setSelectedCatalogItem(item)}
                            className={`cursor-pointer transition hover:bg-slate-50/80 ${
                              isSelected ? 'bg-slate-50 font-medium' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="radio"
                                name="sarvamSelectedNumber"
                                checked={isSelected}
                                onChange={() => setSelectedCatalogItem(item)}
                                className="w-4 h-4 text-slate-900 accent-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3 font-mono font-medium text-slate-900">
                              {item.e164Number}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {item.region}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <span className="font-semibold text-slate-900">₹59/mo</span>{' '}
                              <span className="line-through text-slate-400 text-[11px]">₹159/mo</span>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No numbers match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCatalogModalOpen(false);
                setSelectedCatalogItem(null);
              }}
              className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedCatalogItem || isPurchasing}
              onClick={handlePurchaseCatalogNumber}
              className="px-6 py-2 bg-[#5f6368] hover:bg-[#3c4043] disabled:opacity-40 text-white text-xs font-medium rounded-full transition shadow-xs flex items-center gap-1.5"
            >
              {isPurchasing ? 'Purchasing...' : 'Buy number'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: Assign Caller ID to Voice Agent                              */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Caller ID to Voice Agent"
        maxWidth="md"
      >
        <form onSubmit={handleAssignNumber} className="space-y-4 p-5 text-xs">
          <p className="text-slate-600">
            Select the voice agent service that will use{' '}
            <strong className="font-mono text-slate-900">{selectedNumberForAssign?.e164Number}</strong> as its
            primary outbound caller ID.
          </p>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">Target Service / Voice Agent *</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none text-slate-800 font-medium"
            >
              <option value="">General Outbound & Inbound Calls</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category || 'Service'})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigning}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
            >
              {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 5: Release Number Confirmation with Active Usage Pre-Check      */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Confirm Phone Number Release"
        maxWidth="md"
      >
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Are you sure you want to release this number?</span>
              <p className="text-caption text-amber-800 mt-0.5">
                Releasing <strong className="font-mono text-slate-900">{selectedNumberForRelease?.e164Number}</strong>{' '}
                will disconnect it from your account and detach all outbound caller ID configurations.
              </p>
            </div>
          </div>

          {/* Usage Pre-Check Warning */}
          {isCheckingUsage ? (
            <p className="text-caption text-slate-400 italic">Checking active deployments and ongoing calls...</p>
          ) : usageDetails?.inUse ? (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Active Deployments Detected:</span>
              </span>
              <ul className="list-disc list-inside text-caption text-rose-800 space-y-0.5 pl-1">
                {usageDetails.activeDeployments.map((dep, idx) => (
                  <li key={idx}>{dep}</li>
                ))}
              </ul>
              <label className="flex items-center gap-2 pt-2 text-rose-950 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmForceRelease}
                  onChange={(e) => setConfirmForceRelease(e.target.checked)}
                  className="rounded border-rose-300 text-rose-600"
                />
                <span>I understand this number is currently in use and want to force release it.</span>
              </label>
            </div>
          ) : null}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsReleaseModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
            >
              Keep Number
            </button>
            <button
              type="button"
              onClick={handleConfirmRelease}
              disabled={isReleasing || (usageDetails?.inUse && !confirmForceRelease)}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
            >
              {isReleasing ? 'Releasing...' : 'Release Number'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 6: View Full Number Details                                     */}
      {/* ===================================================================== */}
      <Modal
        isOpen={!!selectedNumberForDetails}
        onClose={() => setSelectedNumberForDetails(null)}
        title="Caller ID Technical Details"
        maxWidth="md"
      >
        {selectedNumberForDetails && (
          <div className="p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]">
              <div>
                <span className="text-caption text-slate-400 block font-sans">E.164 Number</span>
                <span className="font-bold text-slate-900">{selectedNumberForDetails.e164Number}</span>
              </div>
              <div>
                <span className="text-caption text-slate-400 block font-sans">Country Calling Code</span>
                <span className="font-bold text-slate-900">{selectedNumberForDetails.callingCode}</span>
              </div>
              <div>
                <span className="text-caption text-slate-400 block font-sans">Country Name</span>
                <span className="font-bold text-slate-900">{selectedNumberForDetails.countryName}</span>
              </div>
              <div>
                <span className="text-caption text-slate-400 block font-sans">Number Type</span>
                <span className="font-bold text-slate-900">{selectedNumberForDetails.numberType}</span>
              </div>
              <div>
                <span className="text-caption text-slate-400 block font-sans">Trunk Connection</span>
                <span className="font-bold text-slate-900">{selectedNumberForDetails.provider}</span>
              </div>
              <div>
                <span className="text-caption text-slate-400 block font-sans">Provider Status</span>
                <span className="font-bold text-slate-900">{selectedNumberForDetails.providerStatus}</span>
              </div>
              <div>
                <span className="text-caption text-slate-400 block font-sans">KYC Status</span>
                <span className="font-bold text-slate-900">{selectedNumberForDetails.kycStatus}</span>
              </div>
              <div>
                <span className="text-caption text-slate-400 block font-sans">Last Synchronized</span>
                <span className="text-slate-700">
                  {new Date(selectedNumberForDetails.lastSynchronizedAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNumberForDetails(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

