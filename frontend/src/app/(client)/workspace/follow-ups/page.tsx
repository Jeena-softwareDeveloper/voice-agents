'use client';

import React, { useEffect, useState } from 'react';
import { followUpsApi } from '@/features/follow-ups/api/follow-ups.api';
import { FollowUp } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, DataTableColumn } from '@/components/common/tables/DataTable';
import { Button } from '@/components/common/buttons/Button';
import { Modal } from '@/components/common/modals/Modal';
import { useToast } from '@/components/common/feedback/Toast';
import {
  CalendarCheck,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Phone,
  PhoneCall,
  User,
  Layers,
  MapPin,
  X,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  ExternalLink,
} from 'lucide-react';

export default function FollowUpsPage() {
  const { success, error: toastError } = useToast();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [isLoading, setIsLoading] = useState(true);

  // Call History Slide-over Drawer
  const [selectedFollowUpForHistory, setSelectedFollowUpForHistory] = useState<FollowUp | null>(null);

  // Reschedule Modal
  const [rescheduleFollowUp, setRescheduleFollowUp] = useState<FollowUp | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    loadFollowUps();
  }, [filter]);

  const loadFollowUps = () => {
    setIsLoading(true);
    followUpsApi
      .getFollowUps(filter === 'all' ? undefined : filter)
      .then(setFollowUps)
      .catch((err) => toastError('Failed to load tasks', err.message))
      .finally(() => setIsLoading(false));
  };

  const handleMarkComplete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await followUpsApi.updateFollowUp(id, {
        status: 'COMPLETED',
        outcomeNotes: 'Follow-up action verified and completed.',
      });
      success('Follow-up Completed', 'Customer task marked as completed.');
      loadFollowUps();
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleFollowUp || !newDueDate) return;

    setIsRescheduling(true);
    try {
      await followUpsApi.updateFollowUp(rescheduleFollowUp.id, {
        dueDate: new Date(newDueDate).toISOString(),
        status: 'PENDING',
      });
      success('Rescheduled', 'Follow-up date & time updated successfully.');
      setRescheduleFollowUp(null);
      setNewDueDate('');
      loadFollowUps();
    } catch (err: any) {
      toastError('Reschedule Failed', err.message);
    } finally {
      setIsRescheduling(false);
    }
  };

  // KPI Metrics Calculation
  const counts = {
    today: followUps.filter((f) => {
      const d = new Date(f.dueDate);
      const today = new Date();
      return f.status !== 'COMPLETED' && d.toDateString() === today.toDateString();
    }).length,
    overdue: followUps.filter((f) => f.status === 'OVERDUE' || (new Date(f.dueDate) < new Date() && f.status !== 'COMPLETED')).length,
    upcoming: followUps.filter((f) => new Date(f.dueDate) > new Date() && f.status !== 'COMPLETED').length,
    completed: followUps.filter((f) => f.status === 'COMPLETED').length,
  };

  const columns: DataTableColumn<FollowUp>[] = [
    {
      id: 'customer',
      header: 'Customer Name & Phone',
      sortable: true,
      cell: (f) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-xs block">{f.contact.fullName}</span>
            {f.contact.consentGranted && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Consent
              </span>
            )}
          </div>
          <a
            href={`tel:${f.contact.phone}`}
            className="font-mono text-caption text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{f.contact.phone}</span>
          </a>
        </div>
      ),
    },
    {
      id: 'service',
      header: 'Related Service',
      sortable: true,
      cell: (f) => {
        const serviceName = f.service?.name || f.lead?.service?.name || 'General Real Estate';
        return (
          <div>
            <span className="font-semibold text-slate-800 text-xs block">{serviceName}</span>
            <span className="text-caption text-slate-400 block">
              {f.service?.category || 'Offering'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'stage',
      header: 'Current Stage',
      sortable: true,
      cell: (f) => {
        const stageName = f.currentStage || f.stage?.name || 'Requirement Collection';
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {stageName}
          </span>
        );
      },
    },
    {
      id: 'dueDate',
      header: 'Next Follow-up Date & Time',
      sortable: true,
      cell: (f) => {
        const d = new Date(f.dueDate);
        const isPast = d < new Date() && f.status !== 'COMPLETED';
        return (
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
              <Clock className={`w-3.5 h-3.5 ${isPast ? 'text-rose-500' : 'text-slate-400'}`} />
              <span className={isPast ? 'text-rose-600 font-bold' : ''}>
                {d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <span className="text-caption text-slate-400 block pl-4.5">
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Follow-up Status',
      sortable: true,
      cell: (f) => {
        const isCompleted = f.status === 'COMPLETED';
        const isOverdue = f.status === 'OVERDUE' || (new Date(f.dueDate) < new Date() && !isCompleted);
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded text-micro font-bold uppercase border ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isOverdue
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
          </span>
        );
      },
    },
    {
      id: 'meetingStatus',
      header: 'Meeting / Site Visit',
      cell: (f) => {
        const meeting = f.meetingStatus;
        if (!meeting || meeting === 'NOT_APPLICABLE') {
          return <span className="text-caption text-slate-400">None scheduled</span>;
        }
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-micro font-bold ${
              meeting === 'COMPLETED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}
          >
            <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
            {meeting === 'SCHEDULED' ? 'Visit Booked' : meeting}
          </span>
        );
      },
    },
    {
      id: 'owner',
      header: 'Assigned Owner',
      cell: (f) => (
        <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
          <Bot className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate max-w-[130px]">{f.assignedOwner || 'AI Voice Agent (Simran)'}</span>
        </div>
      ),
    },
    {
      id: 'callHistory',
      header: 'Call History',
      cell: (f) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFollowUpForHistory(f);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
        >
          <PhoneCall className="w-3 h-3 text-blue-600" />
          <span>View Calls</span>
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      align: 'right',
      cell: (f) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {f.status !== 'COMPLETED' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setRescheduleFollowUp(f);
                  setNewDueDate(new Date(f.dueDate).toISOString().slice(0, 16));
                }}
                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition text-xs font-semibold"
                title="Reschedule follow-up"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMarkComplete(f.id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                title="Mark completed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </>
          )}
          {f.status === 'COMPLETED' && (
            <span className="text-caption text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolved
            </span>
          )}
        </div>
      ),
    },
  ];

  const renderMobileCard = (f: FollowUp) => (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-bold text-xs text-slate-900 block">{f.contact.fullName}</span>
          <span className="font-mono text-caption text-blue-600 block">{f.contact.phone}</span>
        </div>
        <span
          className={`text-micro font-bold px-2 py-0.5 rounded uppercase border ${
            f.status === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {f.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <div>
          <span className="text-caption text-slate-400 block font-medium">Service</span>
          <span className="font-semibold text-slate-800">{f.service?.name || f.lead?.service?.name || 'Service'}</span>
        </div>
        <div>
          <span className="text-caption text-slate-400 block font-medium">Current Stage</span>
          <span className="font-semibold text-blue-700">{f.currentStage || 'Stage'}</span>
        </div>
        <div>
          <span className="text-caption text-slate-400 block font-medium">Next Due</span>
          <span className="font-semibold text-slate-800">{new Date(f.dueDate).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-caption text-slate-400 block font-medium">Meeting Status</span>
          <span className="font-semibold text-purple-700">{f.meetingStatus || 'None'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setSelectedFollowUpForHistory(f)}
          className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call History</span>
        </button>

        {f.status !== 'COMPLETED' && (
          <Button
            size="sm"
            onClick={() => handleMarkComplete(f.id)}
            className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
          >
            Mark Done
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Follow-ups & AI Customer Pipelines"
        description="Track customer progression across configured service stages, schedule calls, verify site visits, and inspect conversation transcripts."
        recordCount={followUps.length}
        recordLabel="tasks"
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-caption font-semibold">
            <span>Today&apos;s Follow-ups</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">{counts.today}</div>
          <span className="text-[11px] text-slate-400">Scheduled for today</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-caption font-semibold">
            <span>Upcoming Tasks</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">{counts.upcoming}</div>
          <span className="text-[11px] text-slate-400">Future scheduled interactions</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-caption font-semibold">
            <span>Overdue Callbacks</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-600 mt-1">{counts.overdue}</div>
          <span className="text-[11px] text-rose-500">Requires immediate attention</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-caption font-semibold">
            <span>Completed Actions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-1">{counts.completed}</div>
          <span className="text-[11px] text-slate-400">Successfully closed tasks</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 text-xs overflow-x-auto scrollbar-none pb-1">
        {(
          [
            { id: 'today', label: "Today's Follow-ups" },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All Follow-ups' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={followUps}
        isLoading={isLoading}
        renderMobileCard={renderMobileCard}
        emptyTitle="No follow-up tasks in this view"
        emptyDescription="All customer commitments for this filter are up to date."
      />

      {/* Slide-over Drawer: Call History & Audio Transcripts */}
      {selectedFollowUpForHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Call History & Transcripts</h3>
                <p className="text-caption text-slate-500 mt-0.5">
                  {selectedFollowUpForHistory.contact.fullName} • {selectedFollowUpForHistory.contact.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFollowUpForHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
                <div className="font-bold text-blue-900">Current Pipeline Stage</div>
                <div className="text-blue-800 font-semibold">
                  {selectedFollowUpForHistory.currentStage || 'Requirement Collection'}
                </div>
                <div className="text-[11px] text-blue-700">
                  Offering: {selectedFollowUpForHistory.service?.name || selectedFollowUpForHistory.lead?.service?.name || 'Service Offering'}
                </div>
              </div>

              {/* Call Records */}
              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block text-slate-400">
                  Recorded Outbound Telephony Sessions
                </span>

                {selectedFollowUpForHistory.callHistory && Array.isArray(selectedFollowUpForHistory.callHistory) && selectedFollowUpForHistory.callHistory.length > 0 ? (
                  selectedFollowUpForHistory.callHistory.map((call: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          Call Session #{idx + 1}
                        </span>
                        <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {call.outcome || 'Completed'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-caption text-slate-500">
                        <span>Duration: {call.duration || '2m 15s'}</span>
                        <span>Date: {new Date(call.date).toLocaleDateString()}</span>
                      </div>

                      {call.summary && (
                        <div className="p-2 bg-white rounded border border-slate-200 text-caption text-slate-700 leading-relaxed">
                          <strong>AI Summary:</strong> {call.summary}
                        </div>
                      )}
                    </div>
                  ))
                ) : selectedFollowUpForHistory.lead?.calls && selectedFollowUpForHistory.lead.calls.length > 0 ? (
                  selectedFollowUpForHistory.lead.calls.map((c: any, idx: number) => (
                    <div key={c.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          Outbound Call
                        </span>
                        <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {c.outcome || 'Answered'}
                        </span>
                      </div>
                      <div className="text-caption text-slate-500">
                        Duration: {c.durationSeconds}s • {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                      {c.summary && (
                        <div className="p-2 bg-white rounded border border-slate-200 text-caption text-slate-700 leading-relaxed">
                          <strong>Summary:</strong> {c.summary}
                        </div>
                      )}
                      {c.transcript && (
                        <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {c.transcript}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-caption">
                    Initial call session queued. The AI agent is preparing outbound dialer connection.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFollowUpForHistory(null)}
                className="text-xs rounded-lg"
              >
                Close Drawer
              </Button>
              {selectedFollowUpForHistory.status !== 'COMPLETED' && (
                <Button
                  size="sm"
                  onClick={() => {
                    handleMarkComplete(selectedFollowUpForHistory.id);
                    setSelectedFollowUpForHistory(null);
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Mark Follow-up Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleFollowUp && (
        <Modal
          isOpen={Boolean(rescheduleFollowUp)}
          onClose={() => setRescheduleFollowUp(null)}
          title="Reschedule Customer Follow-up"
          maxWidth="sm"
        >
          <form onSubmit={handleSaveReschedule} className="space-y-4 text-xs p-4 sm:p-6">
            <div>
              <span className="font-bold text-slate-900 block">{rescheduleFollowUp.contact.fullName}</span>
              <span className="text-caption text-slate-500 block">{rescheduleFollowUp.title}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Follow-up Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRescheduleFollowUp(null)}
                className="text-xs rounded-lg"
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isRescheduling} className="text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                Save Rescheduled Date
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
