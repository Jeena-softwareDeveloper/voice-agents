'use client';

import React, { useEffect, useState } from 'react';
import { followUpsApi } from '@/features/follow-ups/api/follow-ups.api';
import { FollowUp } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, DataTableColumn } from '@/components/common/tables/DataTable';
import { StatusBadge } from '@/components/common/badges/StatusBadge';
import { Button } from '@/components/common/buttons/Button';
import { useToast } from '@/components/common/feedback/Toast';
import { CheckCircle2, Clock, Calendar, CheckSquare, Sparkles } from 'lucide-react';

export default function FollowUpsPage() {
  const { success, error } = useToast();
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
      .catch((err) => error('Failed to load tasks', err.message))
      .finally(() => setIsLoading(false));
  };

  const handleMarkComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await followUpsApi.updateFollowUp(id, {
        status: 'COMPLETED',
        outcomeNotes: 'Follow-up executed successfully by sales agent.',
      });
      success('Task Completed', 'Action marked as completed.');
      loadFollowUps();
    } catch (err: any) {
      error('Failed to update task', err.message);
    }
  };

  const columns: DataTableColumn<FollowUp>[] = [
    {
      id: 'contact',
      header: 'Prospect Contact',
      sortable: true,
      cell: (f) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{f.contact.fullName}</span>
          <span className="font-mono text-caption text-slate-400 block">{f.contact.phone}</span>
        </div>
      ),
    },
    {
      id: 'title',
      header: 'Task Title & Action',
      sortable: true,
      cell: (f) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{f.title}</span>
          {f.description && <span className="text-caption text-slate-500 line-clamp-1 block">{f.description}</span>}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Activity Type',
      sortable: true,
      accessorKey: 'type',
      cell: (f) => (
        <span className="inline-flex px-2 py-0.5 rounded text-caption font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
          {f.type}
        </span>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      sortable: true,
      accessorKey: 'priority',
      cell: (f) => {
        const priorityColors: Record<string, string> = {
          URGENT: 'text-rose-700 font-bold bg-rose-50 border-rose-200/60',
          HIGH: 'text-amber-700 font-semibold bg-amber-50 border-amber-200/60',
          MEDIUM: 'text-blue-700 font-medium bg-blue-50 border-blue-200/60',
          LOW: 'text-slate-600 bg-slate-50 border-slate-200',
        };
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-micro uppercase font-bold border ${priorityColors[f.priority] || ''}`}>
            {f.priority}
          </span>
        );
      },
    },
    {
      id: 'dueDate',
      header: 'Due Date',
      sortable: true,
      accessorKey: 'dueDate',
      cell: (f) => (
        <span className="text-xs text-slate-600">
          {new Date(f.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (f) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-micro font-semibold ${
          f.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {f.status}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      cell: (f) =>
        f.status === 'PENDING' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleMarkComplete(f.id, e)}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            title="Mark callback as finished"
          >
            Complete
          </Button>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Done</span>
        ),
    },
  ];

  const renderMobileFollowUpCard = (f: FollowUp) => (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-bold text-xs text-slate-900 block">{f.contact.fullName}</span>
          <span className="font-mono text-caption text-slate-500 block">{f.contact.phone}</span>
        </div>
        <span className={`text-micro font-bold px-1.5 py-0.5 rounded ${
          f.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {f.status}
        </span>
      </div>

      <div className="p-2 bg-slate-50 rounded border border-slate-100 text-xs">
        <span className="font-semibold text-slate-800 block text-caption">{f.title}</span>
        {f.description && <p className="text-caption text-slate-500 mt-0.5">{f.description}</p>}
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-caption text-slate-500">
          Due: {new Date(f.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
        {f.status === 'PENDING' && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2"
            onClick={(e) => handleMarkComplete(f.id, e)}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Mark Done
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Follow-ups & Tasks"
        description="Scheduled callbacks, on-site tours, document handovers, and customer commitments."
        infoTooltip="Track upcoming, overdue and completed customer interactions. Keep your sales reps on schedule."
        recordCount={followUps.length}
        recordLabel="tasks"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/90 text-xs overflow-x-auto scrollbar-none pb-0.5">
        {(['all', 'today', 'upcoming', 'overdue', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-colors whitespace-nowrap ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={followUps}
        isLoading={isLoading}
        renderMobileCard={renderMobileFollowUpCard}
        emptyTitle="No follow-up tasks in this view"
        emptyDescription="Schedule a callback or task from the lead detail view."
      />
    </div>
  );
}
