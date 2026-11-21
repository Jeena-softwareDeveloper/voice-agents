'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { pipelineApi } from '@/features/sales-pipeline/api/pipeline.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { Lead } from '@/types';
import { GitBranch, User, ArrowRight, CheckCircle2 } from 'lucide-react';

const STAGES = [
  { id: 'NEW_LEAD', label: 'New Lead' },
  { id: 'AI_CONTACTED', label: 'AI Contacted' },
  { id: 'QUALIFIED', label: 'Qualified' },
  { id: 'INTERESTED', label: 'Interested' },
  { id: 'MEETING_SCHEDULED', label: 'Meeting / Visit' },
  { id: 'NEGOTIATION', label: 'Negotiation' },
  { id: 'WON', label: 'Won' },
  { id: 'LOST', label: 'Lost' },
];

export default function SalesPipelinePage() {
  const [stages, setStages] = useState<Record<string, Lead[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = () => {
    setIsLoading(true);
    pipelineApi
      .getStages()
      .then(setStages)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleAdvanceStage = async (leadId: string, currentStage: string) => {
    const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
    if (currentIndex >= STAGES.length - 2) return; // Before WON/LOST

    const nextStage = STAGES[currentIndex + 1].id;
    setMovingLeadId(leadId);

    try {
      await pipelineApi.moveStage(leadId, nextStage, 'Moved by sales agent');
      loadStages();
    } catch (err) {
      console.error(err);
    } finally {
      setMovingLeadId(null);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading Sales Pipeline..." className="py-20" />;
  }

  return (
    <div>
      <PageHeader
        title="Sales Pipeline"
        description="Visual lead-to-sale lifecycle tracking from initial inbound contact through automated AI qualification to final customer conversion."
      />

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-6">
        {STAGES.map((stage) => {
          const leadsInStage = stages[stage.id] || [];
          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 tracking-wide">{stage.label}</span>
                <span className="text-[10px] bg-white font-semibold text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  {leadsInStage.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {leadsInStage.length ? (
                  leadsInStage.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <Link
                          href={`/workspace/calls/${lead.id}`}
                          className="font-bold text-xs text-slate-900 hover:text-brand-600 transition-colors"
                        >
                          {lead.contact.fullName}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-400">{lead.contact.phone.slice(-4)}</span>
                      </div>

                      <div className="text-[11px] text-brand-700 font-medium mt-1">
                        {lead.service.name}
                      </div>

                      {lead.qualificationNotes && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 bg-slate-50 p-1.5 rounded">
                          {lead.qualificationNotes}
                        </p>
                      )}

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {lead.calls?.length || 0} calls
                        </span>
                        {stage.id !== 'WON' && stage.id !== 'LOST' && (
                          <button
                            disabled={movingLeadId === lead.id}
                            onClick={() => handleAdvanceStage(lead.id, stage.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            Advance <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-4">No prospects</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
