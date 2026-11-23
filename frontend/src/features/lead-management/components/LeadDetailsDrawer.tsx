'use client';

import React, { useState } from 'react';
import { Lead, Service } from '@/types';
import { StatusBadge } from '@/components/common/badges/StatusBadge';
import { Button } from '@/components/common/buttons/Button';
import {
  X,
  Bot,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Volume2,
  TrendingUp,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { aiCallingApi } from '@/features/ai-calling/api/ai-calling.api';
import { leadsApi } from '@/features/lead-management/api/leads.api';
import { useToast } from '@/components/common/feedback/Toast';

interface LeadDetailsDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  onOpenConvertModal?: (lead: Lead) => void;
}

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onOpenConvertModal,
}) => {
  const { success, error, info } = useToast();
  const [isCalling, setIsCalling] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  const isServiceApproved = lead.service?.serviceAiConfig?.status === 'APPROVED';
  const latestCall = lead.calls?.[0];

  const handleTriggerAiCall = async () => {
    if (!isServiceApproved) {
      error('Service Not Approved', `Service '${lead.service.name}' is pending Platform Admin AI approval before calling.`);
      return;
    }
    if (!lead.aiCallingEligible) {
      error('Ineligible for Calling', 'This lead is marked as not eligible for automated AI calling.');
      return;
    }

    setIsCalling(true);
    try {
      await aiCallingApi.dispatchCall(lead.id);
      success('AI Call Dispatched', `AI voice call completed for ${lead.contact.fullName}.`);
      onLeadUpdated();
    } catch (err: any) {
      error('Call Execution Failed', err.message || 'Unable to place automated call.');
    } finally {
      setIsCalling(false);
    }
  };

  const handleStageChange = async (newStage: any) => {
    setIsUpdatingStage(true);
    try {
      await leadsApi.updateLead(lead.id, { status: newStage });
      success('Stage Updated', `Lead moved to ${newStage.replace(/_/g, ' ')}.`);
      onLeadUpdated();
    } catch (err: any) {
      error('Update Failed', err.message);
    } finally {
      setIsUpdatingStage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full sm:max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-3.5 sm:px-5 py-3.5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
              {lead.contact.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate leading-tight">
                {lead.contact.fullName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge value={lead.status} category="lead-stage" size="sm" />
                <a
                  href={`tel:${lead.contact.phone}`}
                  className="text-caption text-blue-600 hover:underline font-mono truncate"
                  title="Call contact via phone"
                >
                  {lead.contact.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              aria-label="Close details drawer"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="px-3.5 sm:px-5 py-2.5 border-b border-slate-200/80 bg-white flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-caption font-medium text-slate-500">Stage:</span>
            <select
              value={lead.status}
              disabled={isUpdatingStage}
              onChange={(e) => handleStageChange(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold bg-white focus:outline-none focus:border-blue-500 text-slate-800"
            >
              <option value="NEW_LEAD">New</option>
              <option value="AI_CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="INTERESTED">Interested</option>
              <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {onOpenConvertModal && lead.status !== 'WON' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenConvertModal(lead)}
                leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
              >
                Convert
              </Button>
            )}
            <Button
              size="sm"
              isLoading={isCalling}
              onClick={handleTriggerAiCall}
              leftIcon={<Bot className="w-3.5 h-3.5" />}
            >
              Call via AI
            </Button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Service & AI Agent Specification Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900">Service AI Configuration</span>
              </div>
              <StatusBadge
                value={isServiceApproved ? 'APPROVED' : 'PENDING_APPROVAL'}
                category="approval"
                size="sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-caption text-slate-400 block font-medium">Associated Service</span>
                <span className="font-semibold text-slate-800 text-xs">{lead.service?.name}</span>
                <span className="text-micro text-slate-500 block">{lead.service?.category}</span>
              </div>
              <div>
                <span className="text-caption text-slate-400 block font-medium">Assigned AI Voice Agent</span>
                <span className="font-semibold text-purple-700 text-xs flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  {isServiceApproved
                    ? `${lead.service.name} Agent (Bulbul V4)`
                    : 'Pending Configuration'}
                </span>
                <span className="text-micro text-slate-500 block">
                  Language: {lead.service.serviceAiConfig?.language || 'Hindi (India)'}
                </span>
              </div>
            </div>

            {lead.service?.description && (
              <p className="text-caption text-slate-600 bg-white p-2.5 rounded border border-slate-200/70 leading-relaxed">
                {lead.service.description}
              </p>
            )}
          </div>

          {/* Contact Details */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-3.5 h-3.5 text-slate-500" /> Contact Profile
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-caption text-slate-400 font-medium">Full Name</span>
                <p className="font-semibold text-slate-800 mt-0.5">{lead.contact.fullName}</p>
              </div>
              <div>
                <span className="text-caption text-slate-400 font-medium">Phone Number</span>
                <p className="font-mono font-semibold text-slate-800 mt-0.5">{lead.contact.phone}</p>
              </div>
              <div>
                <span className="text-caption text-slate-400 font-medium">Email Address</span>
                <p className="text-slate-700 mt-0.5">{lead.contact.email || '—'}</p>
              </div>
              <div>
                <span className="text-caption text-slate-400 font-medium">Location</span>
                <p className="text-slate-700 mt-0.5">{lead.contact.location || '—'}</p>
              </div>
              <div>
                <span className="text-caption text-slate-400 font-medium">Lead Source</span>
                <p className="text-slate-700 mt-0.5">{lead.leadSource || 'CSV Import'}</p>
              </div>
              <div>
                <span className="text-caption text-slate-400 font-medium">Calling Consent</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              </div>
            </div>
          </div>

          {/* AI Voice Calling History & Transcripts */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-purple-600" /> Call History & Audio Telemetry
              </h3>
              <span className="text-caption text-slate-500 font-medium">
                Attempts: {lead.callAttempts || 0}
              </span>
            </div>

            {lead.calls && lead.calls.length > 0 ? (
              <div className="space-y-3">
                {lead.calls.map((call) => (
                  <div key={call.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge value={call.outcome || call.status} category="call-status" size="sm" />
                        <span className="text-caption text-slate-500 font-medium">
                          Duration: {call.durationSeconds}s
                        </span>
                      </div>
                      <span className="text-micro text-slate-400">
                        {new Date(call.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Audio recording player preview */}
                    {call.recordingUrl && (
                      <div className="p-2 bg-white rounded border border-slate-200/80 flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-micro text-slate-500 block truncate font-mono">
                            {call.recordingUrl}
                          </span>
                        </div>
                        <span className="text-micro font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                          ₹{call.costAmount || '0.00'}
                        </span>
                      </div>
                    )}

                    {/* Summary */}
                    {call.summary && (
                      <div>
                        <span className="text-micro font-bold uppercase tracking-wider text-slate-400">
                          AI Executive Summary
                        </span>
                        <p className="text-caption text-slate-700 mt-0.5 bg-white p-2 rounded border border-slate-200/60 leading-relaxed">
                          {call.summary}
                        </p>
                      </div>
                    )}

                    {/* Transcript */}
                    {call.transcript && (
                      <div>
                        <span className="text-micro font-bold uppercase tracking-wider text-slate-400">
                          Full Audio Transcript
                        </span>
                        <pre className="text-caption text-slate-700 mt-0.5 bg-white p-2.5 rounded border border-slate-200/60 whitespace-pre-wrap font-sans leading-relaxed">
                          {call.transcript}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50/60 rounded-md border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No outbound calls dispatched yet.</p>
                <p className="text-caption text-slate-400 mt-0.5">
                  Click 'Call via AI' to begin conversational qualification.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
