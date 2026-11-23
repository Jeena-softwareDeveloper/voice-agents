'use client';

import React from 'react';

export type StatusCategory = 'lead-stage' | 'call-status' | 'interest' | 'approval';

interface StatusBadgeProps {
  value: string;
  category?: StatusCategory;
  size?: 'sm' | 'md';
  className?: string;
}

export function formatHumanReadable(value: string): string {
  if (!value) return '-';

  const map: Record<string, string> = {
    // Lead Stages
    NEW_LEAD: 'New',
    AI_CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    INTERESTED: 'Interested',
    MEETING_SCHEDULED: 'Meeting Scheduled',
    NEGOTIATION: 'Negotiation',
    WON: 'Won',
    LOST: 'Lost',

    // Call Outcomes & Statuses
    QUEUED: 'Queued',
    IN_PROGRESS: 'Calling',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    BUSY: 'Busy',
    NO_ANSWER: 'No Answer',
    CANCELLED: 'Cancelled',
    ANSWERED: 'Answered',
    CALLBACK_REQUESTED: 'Callback Requested',
    DEMO_REQUESTED: 'Demo Requested',
    OPTED_OUT: 'Opted Out',
    NOT_INTERESTED: 'Not Interested',
    NOT_STARTED: 'Not Started',
    PENDING_APPROVAL: 'Pending Approval',
    NOT_ELIGIBLE: 'Not Eligible',

    // Interest Levels
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    IMMEDIATE: 'High',
    NOT_EVALUATED: 'Not Evaluated',

    // Approvals
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PENDING: 'Pending',
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
  };

  return map[value] || value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  value,
  category = 'lead-stage',
  size = 'sm',
  className = '',
}) => {
  const label = formatHumanReadable(value);
  const normalized = (value || '').toUpperCase();

  // Subtle enterprise styles: subdued backgrounds, clear 1px borders, dark readable text
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200/80';
  let dotColor = 'bg-slate-400';

  if (category === 'lead-stage') {
    switch (normalized) {
      case 'NEW_LEAD':
      case 'NEW':
        styleClasses = 'bg-slate-50 text-slate-700 border-slate-200';
        dotColor = 'bg-slate-400';
        break;
      case 'AI_CONTACTED':
      case 'CONTACTED':
        styleClasses = 'bg-blue-50/70 text-blue-700 border-blue-200/60';
        dotColor = 'bg-blue-500';
        break;
      case 'QUALIFIED':
        styleClasses = 'bg-emerald-50/70 text-emerald-700 border-emerald-200/60';
        dotColor = 'bg-emerald-500';
        break;
      case 'INTERESTED':
        styleClasses = 'bg-indigo-50/70 text-indigo-700 border-indigo-200/60';
        dotColor = 'bg-indigo-500';
        break;
      case 'MEETING_SCHEDULED':
        styleClasses = 'bg-purple-50/70 text-purple-700 border-purple-200/60';
        dotColor = 'bg-purple-500';
        break;
      case 'NEGOTIATION':
        styleClasses = 'bg-amber-50/70 text-amber-700 border-amber-200/60';
        dotColor = 'bg-amber-500';
        break;
      case 'WON':
        styleClasses = 'bg-emerald-100/60 text-emerald-800 border-emerald-300/80 font-semibold';
        dotColor = 'bg-emerald-600';
        break;
      case 'LOST':
        styleClasses = 'bg-rose-50/70 text-rose-700 border-rose-200/60';
        dotColor = 'bg-rose-400';
        break;
    }
  } else if (category === 'call-status') {
    switch (normalized) {
      case 'COMPLETED':
      case 'ANSWERED':
      case 'QUALIFIED':
        styleClasses = 'bg-emerald-50/70 text-emerald-700 border-emerald-200/60';
        dotColor = 'bg-emerald-500';
        break;
      case 'CALLBACK_REQUESTED':
      case 'INTERESTED':
        styleClasses = 'bg-blue-50/70 text-blue-700 border-blue-200/60';
        dotColor = 'bg-blue-500';
        break;
      case 'QUEUED':
      case 'IN_PROGRESS':
      case 'CALLING':
        styleClasses = 'bg-purple-50/70 text-purple-700 border-purple-200/60';
        dotColor = 'bg-purple-500 animate-pulse';
        break;
      case 'NO_ANSWER':
      case 'BUSY':
        styleClasses = 'bg-amber-50/70 text-amber-700 border-amber-200/60';
        dotColor = 'bg-amber-400';
        break;
      case 'FAILED':
      case 'OPTED_OUT':
      case 'NOT_INTERESTED':
        styleClasses = 'bg-rose-50/70 text-rose-700 border-rose-200/60';
        dotColor = 'bg-rose-500';
        break;
      case 'PENDING_APPROVAL':
        styleClasses = 'bg-amber-50/80 text-amber-800 border-amber-200';
        dotColor = 'bg-amber-500';
        break;
      case 'NOT_STARTED':
      default:
        styleClasses = 'bg-slate-50 text-slate-600 border-slate-200';
        dotColor = 'bg-slate-400';
        break;
    }
  } else if (category === 'interest') {
    switch (normalized) {
      case 'HIGH':
      case 'IMMEDIATE':
        styleClasses = 'bg-emerald-50/70 text-emerald-700 border-emerald-200/60 font-semibold';
        dotColor = 'bg-emerald-500';
        break;
      case 'MEDIUM':
        styleClasses = 'bg-blue-50/70 text-blue-700 border-blue-200/60';
        dotColor = 'bg-blue-400';
        break;
      case 'LOW':
        styleClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        dotColor = 'bg-slate-400';
        break;
      default:
        styleClasses = 'bg-slate-50 text-slate-500 border-slate-200';
        dotColor = 'bg-slate-300';
        break;
    }
  } else if (category === 'approval') {
    switch (normalized) {
      case 'APPROVED':
      case 'ACTIVE':
        styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
        break;
      case 'PENDING_APPROVAL':
      case 'PENDING':
        styleClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        dotColor = 'bg-amber-500';
        break;
      case 'REJECTED':
      case 'SUSPENDED':
        styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
        break;
    }
  }

  const sizeClasses = size === 'sm' ? 'text-caption px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-2';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium select-none tracking-tight whitespace-nowrap ${sizeClasses} ${styleClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      {label}
    </span>
  );
};
