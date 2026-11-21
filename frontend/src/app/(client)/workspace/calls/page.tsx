'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsApi } from '@/features/lead-management/api/leads.api';
import { aiCallingApi } from '@/features/ai-calling/api/ai-calling.api';
import { servicesApi } from '@/features/services/api/services.api';
import { Lead, Service } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Button } from '@/components/common/buttons/Button';
import { Select } from '@/components/common/dropdowns/Select';
import { Input } from '@/components/common/inputs/Input';
import {
  PhoneCall,
  UploadCloud,
  DownloadCloud,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Filter,
} from 'lucide-react';

export default function ClientCallsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'call-status'>('all');

  useEffect(() => {
    servicesApi.getTenantServices().then(setServices).catch(console.error);
    loadLeads();
  }, [selectedServiceId, statusFilter]);

  const loadLeads = () => {
    setIsLoading(true);
    leadsApi
      .getTenantLeads({
        serviceId: selectedServiceId || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      })
      .then(setLeads)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  const handleTriggerAiCall = async (leadId: string) => {
    setDispatchingId(leadId);
    try {
      await aiCallingApi.dispatchCall(leadId);
      loadLeads();
    } catch (err: any) {
      alert(err.message || 'Call dispatch failed. Check calling hours or service approval.');
    } finally {
      setDispatchingId(null);
    }
  };

  const columns: Column<Lead>[] = [
    {
      header: 'Lead Name & Phone',
      cell: (l) => (
        <div>
          <div className="font-semibold text-slate-900">{l.contact.fullName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{l.contact.phone}</div>
        </div>
      ),
    },
    {
      header: 'Associated Service',
      cell: (l) => (
        <div>
          <span className="font-semibold text-brand-700">{l.service.name}</span>
          <div className="text-[10px] text-slate-400">{l.service.category}</div>
        </div>
      ),
    },
    {
      header: 'Lead Stage',
      cell: (l) => {
        const stageColors: Record<string, string> = {
          NEW_LEAD: 'bg-slate-100 text-slate-700',
          AI_CONTACTED: 'bg-purple-50 text-purple-700',
          QUALIFIED: 'bg-emerald-50 text-emerald-700',
          INTERESTED: 'bg-blue-50 text-blue-700',
          WON: 'bg-emerald-100 text-emerald-800',
          LOST: 'bg-red-50 text-red-700',
        };
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${stageColors[l.status] || 'bg-slate-100'}`}>
            {l.status}
          </span>
        );
      },
    },
    {
      header: 'Interest Level',
      cell: (l) => (
        <span
          className={`text-xs font-semibold ${
            l.interestLevel === 'HIGH' || l.interestLevel === 'IMMEDIATE'
              ? 'text-emerald-600'
              : 'text-slate-600'
          }`}
        >
          {l.interestLevel}
        </span>
      ),
    },
    {
      header: 'AI Calling Status',
      cell: (l) => {
        const lastCall = l.calls?.[0];
        const isApproved = l.service.serviceAiConfig?.status === 'APPROVED';

        if (!isApproved) {
          return <span className="text-[11px] text-amber-600 font-medium">Service Pending Approval</span>;
        }

        if (lastCall) {
          return (
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {lastCall.outcome || lastCall.status}
              </span>
              <span className="block text-[10px] text-slate-400">
                {lastCall.durationSeconds}s duration
              </span>
            </div>
          );
        }

        return <span className="text-[11px] text-slate-400">Ready to Call</span>;
      },
    },
    {
      header: 'Actions',
      cell: (l) => {
        const isApproved = l.service.serviceAiConfig?.status === 'APPROVED';
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={!isApproved || !l.aiCallingEligible}
              isLoading={dispatchingId === l.id}
              onClick={() => handleTriggerAiCall(l.id)}
              leftIcon={<Bot className="w-3.5 h-3.5" />}
            >
              Call via AI
            </Button>
            <Link href={`/workspace/calls/${l.id}`}>
              <Button size="sm" variant="outline" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                Details
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Calls & Leads Management"
        description="Comprehensive workspace lead database, service-category mapping, and Sarvam AI voice call triggers."
        actions={
          <div className="flex gap-2">
            <Link href="/workspace/calls/import">
              <Button variant="outline" leftIcon={<UploadCloud className="w-4 h-4" />}>
                Import Leads (CSV/Excel)
              </Button>
            </Link>
          </div>
        }
      />

      {/* Internal Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 mb-4 pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'all' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Leads ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('call-status')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'call-status' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Call Status Breakdown
        </button>
      </div>

      {/* Filter Row */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs mb-4 flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            options={[
              { value: '', label: 'All Services' },
              ...services.map((s) => ({ value: s.id, label: s.name })),
            ]}
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
          />
        </div>

        <div className="w-44">
          <Select
            options={[
              { value: '', label: 'All Lead Stages' },
              { value: 'NEW_LEAD', label: 'New Lead' },
              { value: 'AI_CONTACTED', label: 'AI Contacted' },
              { value: 'QUALIFIED', label: 'Qualified' },
              { value: 'INTERESTED', label: 'Interested' },
              { value: 'WON', label: 'Won' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search prospect by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button type="submit" size="sm" variant="secondary" leftIcon={<Filter className="w-3.5 h-3.5" />}>
          Filter
        </Button>
      </form>

      <Table
        columns={columns}
        data={leads}
        isLoading={isLoading}
        emptyTitle="No leads in your workspace"
        emptyDescription="Upload an Excel or CSV file to import leads under your approved service categories."
      />
    </div>
  );
}
