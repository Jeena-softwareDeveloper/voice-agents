'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { leadsApi } from '@/features/lead-management/api/leads.api';
import { aiCallingApi } from '@/features/ai-calling/api/ai-calling.api';
import { servicesApi } from '@/features/services/api/services.api';
import { Lead, Service } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, DataTableColumn } from '@/components/common/tables/DataTable';
import { StatusBadge } from '@/components/common/badges/StatusBadge';
import { Button } from '@/components/common/buttons/Button';
import { DropdownMenu } from '@/components/common/dropdowns/DropdownMenu';
import { useToast } from '@/components/common/feedback/Toast';
import { LeadDetailsDrawer } from '@/features/lead-management/components/LeadDetailsDrawer';
import { AddLeadModal } from '@/features/lead-management/components/AddLeadModal';
import { ImportWizardModal } from '@/features/lead-management/components/ImportWizardModal';
import { AdvancedFiltersPopover } from '@/features/lead-management/components/AdvancedFiltersPopover';

import {
  UploadCloud,
  Download,
  Plus,
  Search,
  X,
  Bot,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  PhoneCall,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  MoreVertical,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown,
  Phone,
} from 'lucide-react';

export default function ClientCallsAndLeadsPage() {
  const { success, error, info } = useToast();

  // Primary Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'breakdown'>('all');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedCallStatus, setSelectedCallStatus] = useState('');
  const [selectedInterest, setSelectedInterest] = useState('');
  const [aiEligibleOnly, setAiEligibleOnly] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isBulkCalling, setIsBulkCalling] = useState(false);

  // Modals & Drawers
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [dispatchingLeadId, setDispatchingLeadId] = useState<string | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadsRes, servicesRes] = await Promise.all([
        leadsApi.getTenantLeads(),
        servicesApi.getTenantServices(),
      ]);
      setLeads(leadsRes);
      setServices(servicesRes);
    } catch (err: any) {
      error('Failed to load leads', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter computation
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search by name or phone or email
      if (search.trim()) {
        const query = search.toLowerCase();
        const nameMatch = lead.contact.fullName.toLowerCase().includes(query);
        const phoneMatch = lead.contact.phone.includes(query);
        const emailMatch = lead.contact.email?.toLowerCase().includes(query) || false;
        if (!nameMatch && !phoneMatch && !emailMatch) return false;
      }

      // Filter by service
      if (selectedServiceId && lead.serviceId !== selectedServiceId) {
        return false;
      }

      // Filter by stage
      if (selectedStage && lead.status !== selectedStage) {
        return false;
      }

      // Filter by call status
      if (selectedCallStatus) {
        const lastCall = lead.calls?.[0];
        if (selectedCallStatus === 'NOT_STARTED') {
          if (lastCall) return false;
        } else {
          if (!lastCall) return false;
          const matchOutcome = lastCall.outcome === selectedCallStatus;
          const matchStatus = lastCall.status === selectedCallStatus;
          if (!matchOutcome && !matchStatus) return false;
        }
      }

      // Filter by interest level
      if (selectedInterest && lead.interestLevel !== selectedInterest) {
        return false;
      }

      // Filter by AI calling eligible
      if (aiEligibleOnly && !lead.aiCallingEligible) {
        return false;
      }

      return true;
    });
  }, [
    leads,
    search,
    selectedServiceId,
    selectedStage,
    selectedCallStatus,
    selectedInterest,
    aiEligibleOnly,
  ]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedServiceId) count++;
    if (selectedStage) count++;
    if (selectedCallStatus) count++;
    if (selectedInterest) count++;
    if (aiEligibleOnly) count++;
    return count;
  }, [selectedServiceId, selectedStage, selectedCallStatus, selectedInterest, aiEligibleOnly]);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedServiceId('');
    setSelectedStage('');
    setSelectedCallStatus('');
    setSelectedInterest('');
    setAiEligibleOnly(false);
  };

  // Single AI Call Trigger
  const handleTriggerAiCall = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    const isApproved = lead.service.serviceAiConfig?.status === 'APPROVED';

    if (!isApproved) {
      error(
        'Service AI Pending',
        `The AI conversation script for '${lead.service.name}' is awaiting approval from Platform Admin.`
      );
      return;
    }

    if (!lead.aiCallingEligible) {
      error('Calling Restricted', 'This lead is marked as not eligible for automated calling.');
      return;
    }

    setDispatchingLeadId(lead.id);
    try {
      await aiCallingApi.dispatchCall(lead.id);
      success('AI Call Dispatched', `AI voice call initiated with ${lead.contact.fullName}.`);
      await loadData();
    } catch (err: any) {
      error('Call Failed', err.message || 'Error communicating with telephony provider.');
    } finally {
      setDispatchingLeadId(null);
    }
  };

  // Bulk Calling
  const handleBulkCall = async (ids: string[]) => {
    setIsBulkCalling(true);
    info('Dispatched Bulk Queue', `Submitting ${ids.length} leads to AI voice outbound calling queue...`);
    try {
      const res = await aiCallingApi.bulkDispatch(ids);
      success('Batch Queue Complete', `${res.dispatched} calls processed, ${res.failed} skipped/failed.`);
      setSelectedLeadIds([]);
      await loadData();
    } catch (err: any) {
      error('Bulk Dispatch Failed', err.message);
    } finally {
      setIsBulkCalling(false);
    }
  };

  // Export Filtered Leads to CSV
  const handleExportCsv = () => {
    if (filteredLeads.length === 0) {
      info('No Records', 'There are no records to export.');
      return;
    }

    const headers = [
      'Lead Name',
      'Phone',
      'Email',
      'Location',
      'Service',
      'Stage',
      'Interest',
      'AI Call Status',
      'Created Date',
    ];
    const rows = filteredLeads.map((l) => [
      `"${l.contact.fullName}"`,
      `"${l.contact.phone}"`,
      `"${l.contact.email || ''}"`,
      `"${l.contact.location || ''}"`,
      `"${l.service.name}"`,
      `"${l.status}"`,
      `"${l.interestLevel}"`,
      `"${l.calls?.[0]?.outcome || l.calls?.[0]?.status || 'NOT_STARTED'}"`,
      `"${new Date(l.createdAt || Date.now()).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Export Generated', `Downloaded ${filteredLeads.length} lead records.`);
  };

  // Column definitions for desktop/tablet enterprise table
  const columns: DataTableColumn<Lead>[] = [
    {
      id: 'lead',
      header: 'Lead',
      sortable: true,
      accessorKey: 'contact' as any,
      width: '240px',
      cell: (l) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-caption shrink-0">
            {l.contact.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <button
              onClick={() => {
                setSelectedLeadForDrawer(l);
                setIsDrawerOpen(true);
              }}
              className="font-bold text-xs text-slate-900 hover:text-blue-600 transition-colors block text-left truncate leading-tight"
            >
              {l.contact.fullName}
            </button>
            <a
              href={`tel:${l.contact.phone}`}
              className="font-mono text-caption text-slate-500 hover:text-blue-600 hover:underline block mt-0.5"
            >
              {l.contact.phone}
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'service',
      header: 'Service',
      sortable: true,
      width: '180px',
      cell: (l) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block truncate">{l.service.name}</span>
          <span className="text-micro text-slate-400 block truncate">{l.service.category}</span>
        </div>
      ),
    },
    {
      id: 'stage',
      header: 'Lead Stage',
      sortable: true,
      accessorKey: 'status',
      width: '140px',
      cell: (l) => <StatusBadge value={l.status} category="lead-stage" size="sm" />,
    },
    {
      id: 'interest',
      header: 'Interest',
      sortable: true,
      accessorKey: 'interestLevel',
      width: '110px',
      cell: (l) => <StatusBadge value={l.interestLevel} category="interest" size="sm" />,
    },
    {
      id: 'aiCallStatus',
      header: 'AI Call Status',
      width: '180px',
      cell: (l) => {
        const isApproved = l.service.serviceAiConfig?.status === 'APPROVED';
        if (!isApproved) {
          return <StatusBadge value="PENDING_APPROVAL" category="approval" size="sm" />;
        }
        const lastCall = l.calls?.[0];
        if (lastCall) {
          return (
            <div className="flex flex-col gap-0.5">
              <StatusBadge value={lastCall.outcome || lastCall.status} category="call-status" size="sm" />
              <span className="text-micro text-slate-400 font-medium pl-0.5">
                {lastCall.durationSeconds}s • {new Date(lastCall.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        }
        return <StatusBadge value="NOT_STARTED" category="call-status" size="sm" />;
      },
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      width: '130px',
      cell: () => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <div className="w-5 h-5 rounded-full bg-slate-200/80 text-micro flex items-center justify-center font-bold text-slate-600">
            JJ
          </div>
          <span className="truncate">Jayant J.</span>
        </div>
      ),
    },
    {
      id: 'lastActivity',
      header: 'Last Activity',
      width: '140px',
      cell: (l) => {
        const lastDate = l.lastCallDate || (l as any).updatedAt || (l as any).createdAt;
        return (
          <span className="text-caption text-slate-500 whitespace-nowrap">
            {new Date(lastDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
            {new Date(lastDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      id: 'nextFollowUp',
      header: 'Next Follow-up',
      width: '140px',
      cell: (l) => {
        const followUp = l.followUps?.[0];
        if (followUp && followUp.status === 'PENDING') {
          return (
            <div>
              <span className="font-semibold text-caption text-blue-700 block truncate">
                {followUp.title}
              </span>
              <span className="text-micro text-slate-400">
                {new Date(followUp.dueDate).toLocaleDateString()}
              </span>
            </div>
          );
        }
        return <span className="text-caption text-slate-400">—</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: '160px',
      cell: (l) => {
        const isApproved = l.service.serviceAiConfig?.status === 'APPROVED';
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              disabled={!isApproved || !l.aiCallingEligible}
              isLoading={dispatchingLeadId === l.id}
              onClick={(e) => handleTriggerAiCall(l, e)}
              className="text-xs h-7 px-2.5 font-medium border-slate-300 hover:border-blue-400 hover:text-blue-700 text-slate-700"
              leftIcon={<Bot className="w-3.5 h-3.5 text-purple-600" />}
            >
              Call via AI
            </Button>

            <DropdownMenu
              items={[
                {
                  label: 'View Full Profile',
                  icon: <Eye className="w-3.5 h-3.5" />,
                  onClick: () => {
                    setSelectedLeadForDrawer(l);
                    setIsDrawerOpen(true);
                  },
                },
                {
                  label: 'Advance Stage',
                  icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                  onClick: () => {
                    setSelectedLeadForDrawer(l);
                    setIsDrawerOpen(true);
                  },
                },
              ]}
              align="right"
            />
          </div>
        );
      },
    },
  ];

  // Mobile Structured Card View Renderer (< md)
  const renderMobileLeadCard = (lead: Lead) => {
    const isApproved = lead.service.serviceAiConfig?.status === 'APPROVED';
    const lastCall = lead.calls?.[0];
    const followUp = lead.followUps?.[0];

    return (
      <div
        key={lead.id}
        onClick={() => {
          setSelectedLeadForDrawer(lead);
          setIsDrawerOpen(true);
        }}
        className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs hover:border-slate-300 transition-all cursor-pointer w-full text-left"
      >
        {/* 1. Top Row: Lead Name (15-16px bold) + Lead Stage Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-card-title sm:text-base text-slate-900 truncate leading-snug">
              {lead.contact.fullName}
            </h3>
          </div>
          <div className="shrink-0">
            <StatusBadge value={lead.status} category="lead-stage" size="sm" />
          </div>
        </div>

        {/* 2. Contact Row: Phone Number (14px clickable tel: link) */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <a
            href={`tel:${lead.contact.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline tracking-tight truncate"
            title="Tap to call via phone dialer"
          >
            {lead.contact.phone}
          </a>
          {lead.contact.email && (
            <span className="text-slate-300 text-xs hidden xs:inline">•</span>
          )}
          {lead.contact.email && (
            <span className="text-xs text-slate-500 truncate hidden xs:inline">
              {lead.contact.email}
            </span>
          )}
        </div>

        {/* 3. Service Info: Associated Service Name (13-14px text) */}
        <div className="flex items-center gap-1.5 text-label text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-800 truncate">{lead.service.name}</span>
          <span className="text-slate-400 text-xs">({lead.service.category})</span>
        </div>

        {/* 4. Compact 2-Column Grid:
            Left: Interest Level + AI Calling Status
            Right: Next Follow-up + Service/Qualification notes */}
        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          {/* Left Column */}
          <div className="space-y-2">
            <div>
              <span className="text-caption font-semibold text-slate-500 block">Interest Level</span>
              <div className="mt-1">
                <StatusBadge value={lead.interestLevel} category="interest" size="sm" />
              </div>
            </div>

            <div>
              <span className="text-caption font-semibold text-slate-500 block">AI Call Status</span>
              <div className="mt-0.5">
                {!isApproved ? (
                  <span className="text-xs font-medium text-amber-600">Pending Setup</span>
                ) : lastCall ? (
                  <span className="text-xs font-medium text-purple-700">
                    {lastCall.outcome || lastCall.status} ({lastCall.durationSeconds}s)
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Not Started</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            <div>
              <span className="text-caption font-semibold text-slate-500 block">Next Follow-up</span>
              <div className="mt-0.5">
                {followUp && followUp.status === 'PENDING' ? (
                  <div>
                    <span className="text-xs font-medium text-blue-700 block truncate">
                      {followUp.title}
                    </span>
                    <span className="text-caption text-slate-500">
                      {new Date(followUp.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">None scheduled</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-caption font-semibold text-slate-500 block">Service Notes</span>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                {lead.qualificationNotes || lead.notes || 'No notes added'}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Bottom Actions Row: Call via AI + Details Buttons */}
        <div
          className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 min-w-0">
            {isApproved && lead.aiCallingEligible ? (
              <Button
                size="sm"
                variant="outline"
                isLoading={dispatchingLeadId === lead.id}
                onClick={(e) => handleTriggerAiCall(lead, e)}
                className="w-full h-10 text-label font-medium border-purple-200 text-purple-700 hover:bg-purple-50 justify-center"
                leftIcon={<Bot className="w-4 h-4 text-purple-600" />}
              >
                Call via AI
              </Button>
            ) : (
              <span className="text-caption text-slate-400 block truncate" title="AI calling requirements not met">
                {!isApproved ? 'Awaiting AI approval' : 'AI not eligible'}
              </span>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedLeadForDrawer(lead);
              setIsDrawerOpen(true);
            }}
            className="h-10 px-3 text-label font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            leftIcon={<Eye className="w-4 h-4 text-slate-500" />}
          >
            Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 w-full max-w-full">
      {/* Unified Single-Row Header: Title, Count, Tabs & Action Buttons */}
      <div className="border-b border-slate-200/90 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3.5">
        {/* Left: Title + Badge + Integrated Tabs */}
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0 py-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Calls & Leads
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold bg-slate-100 text-slate-600 border border-slate-200/70">
              {leads.length} leads
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

          {/* Integrated Tabs on Same Row */}
          <div className="flex items-center gap-1 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-2.5 font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap text-xs ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>All Leads</span>
              <span
                className={`text-caption px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('breakdown')}
              className={`flex items-center gap-1.5 px-3 py-2.5 font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap text-xs ${
                activeTab === 'breakdown'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Call Status</span>
              <span
                className={`text-caption px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'breakdown' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {leads.filter((l) => l.calls && l.calls.length > 0).length} calls
              </span>
            </button>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 pb-2 sm:pb-0 shrink-0 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
          >
            Import Leads
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Lead
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>

          <DropdownMenu
            trigger={
              <Button variant="outline" size="sm" leftIcon={<MoreVertical className="w-3.5 h-3.5" />}>
                More
              </Button>
            }
            items={[
              { label: 'Refresh Records', icon: <RefreshCw className="w-3.5 h-3.5" />, onClick: loadData },
              {
                label: 'Bulk Dispatch All Eligible',
                icon: <Bot className="w-3.5 h-3.5 text-purple-600" />,
                onClick: () => {
                  const eligibleIds = filteredLeads.filter((l) => l.aiCallingEligible).map((l) => l.id);
                  if (eligibleIds.length === 0) {
                    info('No Eligible Leads', 'No leads currently meet calling requirements.');
                    return;
                  }
                  handleBulkCall(eligibleIds);
                },
              },
            ]}
            align="right"
          />
        </div>
      </div>

      {/* Tab: Call Status Breakdown View */}
      {activeTab === 'breakdown' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pb-2 animate-in fade-in duration-150 w-full">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-micro uppercase font-bold text-slate-400">Total Enquiries</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{leads.length}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-micro uppercase font-bold text-emerald-600">Qualified</span>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">
              {leads.filter((l) => l.status === 'QUALIFIED').length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-micro uppercase font-bold text-blue-600">Interested</span>
            <p className="text-xl font-bold text-blue-700 mt-0.5">
              {leads.filter((l) => l.status === 'INTERESTED').length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-micro uppercase font-bold text-purple-600">AI Contacted</span>
            <p className="text-xl font-bold text-purple-700 mt-0.5">
              {leads.filter((l) => l.calls && l.calls.length > 0).length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-micro uppercase font-bold text-amber-600">No Answer / Busy</span>
            <p className="text-xl font-bold text-amber-700 mt-0.5">
              {leads.filter((l) => l.calls?.[0]?.outcome === 'NO_ANSWER' || l.calls?.[0]?.outcome === 'BUSY').length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-micro uppercase font-bold text-emerald-800">Customers Won</span>
            <p className="text-xl font-bold text-emerald-900 mt-0.5">
              {leads.filter((l) => l.status === 'WON').length}
            </p>
          </div>
        </div>
      )}

      {/* 3. Responsive Filter Toolbar */}
      {/* Desktop / Tablet Toolbar (>= md) */}
      <div className="hidden md:flex bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex-wrap items-center justify-between gap-2.5 text-xs w-full">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-md border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Service Category Dropdown */}
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Lead Stage Dropdown */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="">All Stages</option>
            <option value="NEW_LEAD">New Lead</option>
            <option value="AI_CONTACTED">AI Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="INTERESTED">Interested</option>
            <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Customer Won</option>
            <option value="LOST">Lost</option>
          </select>

          {/* AI Call Status Dropdown */}
          <select
            value={selectedCallStatus}
            onChange={(e) => setSelectedCallStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="">All Call Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="COMPLETED">Completed</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="INTERESTED">Interested</option>
            <option value="CALLBACK_REQUESTED">Callback Requested</option>
            <option value="NO_ANSWER">No Answer</option>
            <option value="BUSY">Busy</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Advanced Filter Popover */}
          <AdvancedFiltersPopover
            activeCount={activeFiltersCount}
            onApply={(f) => {
              if (f.interestLevel !== undefined) setSelectedInterest(f.interestLevel);
              if (f.aiEligibleOnly !== undefined) setAiEligibleOnly(f.aiEligibleOnly);
            }}
            onClear={() => {
              setSelectedInterest('');
              setAiEligibleOnly(false);
            }}
          />

          {/* Clear Filters Button (When active) */}
          {(activeFiltersCount > 0 || search) && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Record count indicator */}
        <div className="text-caption text-slate-500 font-medium shrink-0">
          Showing <strong className="text-slate-800">{filteredLeads.length}</strong> of{' '}
          <strong className="text-slate-800">{leads.length}</strong>
        </div>
      </div>

      {/* Mobile Filter & Search Bar (< md): Touch-friendly (min 44px height, 14px text) */}
      <div className="md:hidden bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 w-full">
        <div className="flex items-center gap-2 w-full">
          {/* Full available width search bar: 44px height, 14px text */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 text-sm pl-9 pr-8 rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter button: 44px height, active badge */}
          <button
            onClick={() => setIsMobileFilterOpen((prev) => !prev)}
            aria-label="Toggle filter options"
            className={`h-11 flex items-center gap-1.5 px-3.5 rounded-lg text-label font-semibold border transition-colors shrink-0 ${
              activeFiltersCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-caption flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* More Actions Menu Button: 44px height */}
          <DropdownMenu
            trigger={
              <button
                type="button"
                aria-label="More actions menu"
                className="h-11 w-11 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            items={[
              { label: 'Export Leads CSV', icon: <Download className="w-4 h-4" />, onClick: handleExportCsv },
              { label: 'Refresh Records', icon: <RefreshCw className="w-4 h-4" />, onClick: loadData },
              {
                label: 'Bulk Dispatch All Eligible',
                icon: <Bot className="w-4 h-4 text-purple-600" />,
                onClick: () => {
                  const eligibleIds = filteredLeads.filter((l) => l.aiCallingEligible).map((l) => l.id);
                  if (eligibleIds.length === 0) {
                    info('No Eligible Leads', 'No leads currently meet calling requirements.');
                    return;
                  }
                  handleBulkCall(eligibleIds);
                },
              },
            ]}
            align="right"
          />
        </div>

        {/* Showing Records Counter on Mobile */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span>
            Showing <strong className="text-slate-800">{filteredLeads.length}</strong> of{' '}
            <strong className="text-slate-800">{leads.length}</strong> leads
          </span>
          {(activeFiltersCount > 0 || search) && (
            <button
              onClick={clearAllFilters}
              className="text-rose-600 hover:text-rose-700 font-semibold underline text-xs"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Expandable Mobile Filters Sheet */}
        {isMobileFilterOpen && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 text-sm animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Service Category</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full h-10 text-sm px-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Services</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lead Stage</label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full h-10 text-sm px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Stages</option>
                  <option value="NEW_LEAD">New</option>
                  <option value="AI_CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="MEETING_SCHEDULED">Meeting</option>
                  <option value="WON">Won</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Call Status</label>
                <select
                  value={selectedCallStatus}
                  onChange={(e) => setSelectedCallStatus(e.target.value)}
                  className="w-full h-10 text-sm px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="BUSY">Busy</option>
                  <option value="NO_ANSWER">No Answer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Interest Level</label>
              <select
                value={selectedInterest}
                onChange={(e) => setSelectedInterest(e.target.value)}
                className="w-full h-10 text-sm px-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Interest Levels</option>
                <option value="HIGH">High Interest</option>
                <option value="MEDIUM">Medium Interest</option>
                <option value="LOW">Low Interest</option>
              </select>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEligibleOnly}
                  onChange={(e) => setAiEligibleOnly(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm text-slate-700 font-medium">AI Calling Eligible Only</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2.5">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex-1 h-11 text-sm font-semibold justify-center"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 h-11 text-sm font-semibold justify-center"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Enterprise Data Table with Mobile Cards Fallback */}
      <DataTable
        columns={columns}
        data={filteredLeads}
        isLoading={isLoading}
        enableSelection={true}
        selectedIds={selectedLeadIds}
        onSelectionChange={setSelectedLeadIds}
        renderMobileCard={renderMobileLeadCard}
        emptyTitle="No leads found matching your criteria"
        emptyDescription="Try clearing your filters or create a new lead to get started."
        emptyAction={
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              Add New Lead
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsImportModalOpen(true)}>
              Import CSV/Excel
            </Button>
          </div>
        }
        bulkActions={[
          {
            label: 'Call via AI (Bulk)',
            icon: <Bot className="w-3.5 h-3.5" />,
            onClick: handleBulkCall,
            variant: 'primary',
          },
          {
            label: 'Export Selected',
            icon: <Download className="w-3.5 h-3.5" />,
            onClick: () => handleExportCsv(),
            variant: 'secondary',
          },
        ]}
      />

      {/* 5. Lead Details Slide-Over Drawer */}
      <LeadDetailsDrawer
        lead={selectedLeadForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLeadForDrawer(null);
        }}
        onLeadUpdated={loadData}
      />

      {/* 6. Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        services={services}
        onLeadCreated={loadData}
      />

      {/* 7. Import Wizard Modal */}
      <ImportWizardModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        services={services}
        onImportComplete={loadData}
      />
    </div>
  );
}
