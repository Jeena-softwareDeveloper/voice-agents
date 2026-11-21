'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { aiCallingApi } from '@/features/ai-calling/api/ai-calling.api';
import { Call } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Button } from '@/components/common/buttons/Button';
import { Select } from '@/components/common/dropdowns/Select';
import { Bot, CheckCircle2, PhoneCall, Clock, AlertCircle, FileText } from 'lucide-react';

export default function ClientAiCallingPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, [statusFilter]);

  const loadCalls = () => {
    setIsLoading(true);
    aiCallingApi
      .getTenantCalls({ status: statusFilter || undefined })
      .then(setCalls)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const columns: Column<Call>[] = [
    {
      header: 'Prospect',
      cell: (c) => (
        <div>
          <div className="font-semibold text-slate-900">{c.lead?.contact?.fullName || c.recipientNumber}</div>
          <div className="text-[11px] text-slate-400 font-mono">{c.recipientNumber}</div>
        </div>
      ),
    },
    {
      header: 'Service Category',
      cell: (c) => <span className="font-semibold text-brand-700">{c.service?.name}</span>,
    },
    {
      header: 'Call Outcome',
      cell: (c) => {
        const outcomeColors: Record<string, string> = {
          QUALIFIED: 'bg-emerald-50 text-emerald-700',
          INTERESTED: 'bg-blue-50 text-blue-700',
          CALLBACK_REQUESTED: 'bg-purple-50 text-purple-700',
          ANSWERED: 'bg-slate-100 text-slate-800',
          NO_ANSWER: 'bg-amber-50 text-amber-700',
          FAILED: 'bg-red-50 text-red-700',
        };
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${outcomeColors[c.outcome || ''] || 'bg-slate-100 text-slate-700'}`}>
            {c.outcome || c.status}
          </span>
        );
      },
    },
    {
      header: 'Duration',
      cell: (c) => <span className="text-xs text-slate-700">{c.durationSeconds}s</span>,
    },
    {
      header: 'Call Summary',
      cell: (c) => (
        <p className="text-xs text-slate-600 line-clamp-1 max-w-xs">{c.summary || 'Summary pending processing...'}</p>
      ),
    },
    {
      header: 'Date & Time',
      cell: (c) => (
        <span className="text-xs text-slate-500">
          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Details',
      cell: (c) => (
        <Link href={`/workspace/calls/${c.leadId}`}>
          <Button size="sm" variant="outline">
            Review Lead
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="AI Calling Operations & Live Telemetry"
        description="Monitor automated outbound conversational calling performed by Sarvam AI across your registered service categories."
      />

      {/* Filter */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs mb-4 flex items-center gap-3">
        <div className="w-48">
          <Select
            options={[
              { value: '', label: 'All Call Statuses' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'QUEUED', label: 'Queued' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={calls}
        isLoading={isLoading}
        emptyTitle="No AI call operations recorded yet"
        emptyDescription="Trigger AI calling from your Leads table to initiate conversational voice dialogues."
      />
    </div>
  );
}
