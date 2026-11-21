'use client';

import React, { useEffect, useState } from 'react';
import { followUpsApi } from '@/features/follow-ups/api/follow-ups.api';
import { FollowUp } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Button } from '@/components/common/buttons/Button';
import { CalendarCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'overdue' | 'completed' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFollowUps();
  }, [filter]);

  const loadFollowUps = () => {
    setIsLoading(true);
    followUpsApi
      .getFollowUps(filter)
      .then(setFollowUps)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await followUpsApi.updateFollowUp(id, {
        status: 'COMPLETED',
        outcomeNotes: 'Follow-up executed successfully by sales agent.',
      });
      loadFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<FollowUp>[] = [
    {
      header: 'Prospect Contact',
      cell: (f) => (
        <div>
          <div className="font-semibold text-slate-900">{f.contact.fullName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{f.contact.phone}</div>
        </div>
      ),
    },
    {
      header: 'Task Title',
      cell: (f) => (
        <div>
          <div className="font-semibold text-slate-800">{f.title}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{f.description || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Activity Type',
      cell: (f) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700">
          {f.type}
        </span>
      ),
    },
    {
      header: 'Priority',
      cell: (f) => {
        const priorityColors: Record<string, string> = {
          URGENT: 'text-red-600 font-bold',
          HIGH: 'text-amber-600 font-semibold',
          MEDIUM: 'text-blue-600 font-medium',
          LOW: 'text-slate-500',
        };
        return <span className={`text-xs ${priorityColors[f.priority]}`}>{f.priority}</span>;
      },
    },
    {
      header: 'Due Date',
      cell: (f) => (
        <span className="text-xs text-slate-600">
          {new Date(f.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (f) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
            f.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {f.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (f) =>
        f.status !== 'COMPLETED' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMarkComplete(f.id)}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Mark Done
          </Button>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Completed</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Follow-ups & Scheduled Actions"
        description="Pending and scheduled customer callbacks, meeting requests, and site visits automatically captured from Sarvam AI phone conversations."
      />

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 mb-4 pb-1">
        {(['all', 'today', 'upcoming', 'overdue', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
              filter === tab ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={followUps}
        isLoading={isLoading}
        emptyTitle="No follow-up tasks found"
      />
    </div>
  );
}
