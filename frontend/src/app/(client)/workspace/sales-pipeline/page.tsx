'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { pipelineApi } from '@/features/sales-pipeline/api/pipeline.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/badges/StatusBadge';
import { Button } from '@/components/common/buttons/Button';
import { Lead } from '@/types';
import { LeadDetailsDrawer } from '@/features/lead-management/components/LeadDetailsDrawer';
import { useToast } from '@/components/common/feedback/Toast';
import { InfoTooltip } from '@/components/common/tooltips/InfoTooltip';
import {
  GitBranch,
  ArrowRight,
  User,
  Phone,
  Sparkles,
  Bot,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';

const STAGES = [
  { id: 'NEW_LEAD', label: 'New Lead' },
  { id: 'AI_CONTACTED', label: 'Contacted' },
  { id: 'QUALIFIED', label: 'Qualified' },
  { id: 'INTERESTED', label: 'Interested' },
  { id: 'MEETING_SCHEDULED', label: 'Meeting / Visit' },
  { id: 'NEGOTIATION', label: 'Negotiation' },
  { id: 'WON', label: 'Won' },
  { id: 'LOST', label: 'Lost' },
];

export default function SalesPipelinePage() {
  const { success, error } = useToast();
  const [stages, setStages] = useState<Record<string, Lead[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [mobileSelectedStage, setMobileSelectedStage] = useState<string>('ALL');

  // Drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = () => {
    setIsLoading(true);
    pipelineApi
      .getStages()
      .then(setStages)
      .catch((err) => error('Failed to load pipeline', err.message))
      .finally(() => setIsLoading(false));
  };

  const handleAdvanceStage = async (leadId: string, currentStage: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
    if (currentIndex >= STAGES.length - 2) return;

    const nextStage = STAGES[currentIndex + 1].id;
    setMovingLeadId(leadId);

    try {
      await pipelineApi.moveStage(leadId, nextStage, 'Moved via pipeline board');
      success('Stage Updated', `Lead moved to ${STAGES[currentIndex + 1].label}.`);
      loadStages();
    } catch (err: any) {
      error('Failed to move stage', err.message);
    } finally {
      setMovingLeadId(null);
    }
  };

  const totalLeads = Object.values(stages).reduce((acc, list) => acc + list.length, 0);

  // Filter stages on mobile if single stage view is active
  const visibleStages =
    mobileSelectedStage === 'ALL'
      ? STAGES
      : STAGES.filter((s) => s.id === mobileSelectedStage);

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Sales Pipeline"
        description="Visual deal progression tracking from initial enquiry to AI qualification and closed revenue."
        infoTooltip="Track the progress of your leads from initial enquiry to successful conversion. Move qualified leads through different sales stages."
        recordCount={totalLeads}
        recordLabel="leads in pipeline"
      />

      {/* Mobile Stage Selector Tabs (< sm) */}
      <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setMobileSelectedStage('ALL')}
          className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors ${
            mobileSelectedStage === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          All Stages ({totalLeads})
        </button>
        {STAGES.map((s) => {
          const count = stages[s.id]?.length || 0;
          return (
            <button
              key={s.id}
              onClick={() => setMobileSelectedStage(s.id)}
              className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                mobileSelectedStage === s.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              <span>{s.label}</span>
              <span className="text-micro opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Enterprise Kanban Board with Independent Column Scrolling */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-thin">
        {visibleStages.map((stage) => {
          const leadsInStage = stages[stage.id] || [];
          return (
            <div
              key={stage.id}
              className="w-68 sm:w-72 shrink-0 bg-slate-100/70 rounded-lg p-2.5 border border-slate-200/90 flex flex-col max-h-[calc(100vh-210px)] select-none"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/90 px-1">
                <span className="text-xs font-bold text-slate-800 tracking-tight">{stage.label}</span>
                <span className="text-micro bg-white font-bold text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                  {leadsInStage.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
                {leadsInStage.length ? (
                  leadsInStage.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsDrawerOpen(true);
                      }}
                      className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors leading-tight line-clamp-1">
                          {lead.contact.fullName}
                        </span>
                        <span className="text-micro font-mono text-slate-400 shrink-0">
                          {lead.contact.phone.slice(-4)}
                        </span>
                      </div>

                      <div className="text-caption font-semibold text-slate-700 mt-1 line-clamp-1">
                        {lead.service.name}
                      </div>

                      {lead.qualificationNotes && (
                        <p className="text-caption text-slate-500 mt-1.5 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100 leading-snug">
                          {lead.qualificationNotes}
                        </p>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-micro">
                        <span className="text-slate-400">
                          {lead.calls?.length || 0} calls • {lead.interestLevel}
                        </span>
                        {stage.id !== 'WON' && stage.id !== 'LOST' && (
                          <button
                            disabled={movingLeadId === lead.id}
                            onClick={(e) => handleAdvanceStage(lead.id, stage.id, e)}
                            title="Move lead to next stage in sales pipeline"
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                          >
                            Advance <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-md bg-white/40">
                    No leads in stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailsDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLead(null);
        }}
        onLeadUpdated={loadStages}
      />
    </div>
  );
}
