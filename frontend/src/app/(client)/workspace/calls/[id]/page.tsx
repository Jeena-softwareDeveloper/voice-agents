'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { leadsApi } from '@/features/lead-management/api/leads.api';
import { aiCallingApi } from '@/features/ai-calling/api/ai-calling.api';
import { customersApi } from '@/features/customers/api/customers.api';
import { Lead } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { Modal } from '@/components/common/modals/Modal';
import { Input } from '@/components/common/inputs/Input';
import {
  User,
  Phone,
  Layers,
  Bot,
  CalendarCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [contractValue, setContractValue] = useState('500000');
  const [convertNotes, setConvertNotes] = useState('Enquiry confirmed and agreement signed.');

  useEffect(() => {
    loadLead();
  }, [leadId]);

  const loadLead = () => {
    setIsLoading(true);
    leadsApi
      .getLeadById(leadId)
      .then(setLead)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleTriggerAiCall = async () => {
    setIsCalling(true);
    try {
      await aiCallingApi.dispatchCall(leadId);
      loadLead();
    } catch (err: any) {
      alert(err.message || 'Call failed.');
    } finally {
      setIsCalling(false);
    }
  };

  const handleConvertToCustomer = async () => {
    try {
      await customersApi.convertLead(leadId, Number(contractValue), convertNotes);
      setIsConvertModalOpen(false);
      router.push('/workspace/customers');
    } catch (err: any) {
      alert(err.message || 'Conversion failed.');
    }
  };

  if (isLoading) {
    return <Spinner label="Loading lead profile..." className="py-20" />;
  }

  if (!lead) {
    return <div className="p-8 text-center text-slate-500">Lead record not found.</div>;
  }

  return (
    <div>
      <PageHeader
        title={lead.contact.fullName}
        description={`Lead ID: ${lead.id} • Registered under: ${lead.service.name}`}
        breadcrumbs={[
          { label: 'Calls', href: '/workspace/calls' },
          { label: lead.contact.fullName },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConvertModalOpen(true)}
              leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
            >
              Convert to Customer
            </Button>
            <Button
              size="sm"
              isLoading={isCalling}
              onClick={handleTriggerAiCall}
              leftIcon={<Bot className="w-3.5 h-3.5" />}
            >
              Call via AI Voice
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information & Service Association */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" /> Unified Contact Profile
          </h3>

          <div className="text-xs space-y-3">
            <div>
              <span className="text-slate-400 font-medium">Full Name</span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">{lead.contact.fullName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Phone Number</span>
              <p className="font-mono font-semibold text-slate-800 mt-0.5">{lead.contact.phone}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Email</span>
              <p className="font-semibold text-slate-800 mt-0.5">{lead.contact.email || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Location</span>
              <p className="font-semibold text-slate-800 mt-0.5">{lead.contact.location || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Consent Status</span>
              <p className="font-semibold text-emerald-600 mt-0.5">Verified & Consented</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-2">Associated Service</h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-brand-700">{lead.service.name}</span>
              <p className="text-slate-500 text-caption mt-0.5">{lead.service.category}</p>
            </div>
          </div>
        </div>

        {/* AI Call History & Transcripts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" /> AI Voice Call Operations ({lead.calls?.length || 0})
            </h3>

            <div className="space-y-4">
              {lead.calls?.length ? (
                lead.calls.map((call) => (
                  <div key={call.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Outcome: {call.outcome || call.status}</span>
                      <span className="text-slate-400">{new Date(call.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-4 text-slate-600">
                      <span>Duration: <strong>{call.durationSeconds}s</strong></span>
                      <span>Cost: <strong>₹{call.costAmount}</strong></span>
                    </div>
                    {call.summary && (
                      <div>
                        <span className="font-medium text-slate-500">Summary:</span>
                        <p className="text-slate-700 mt-0.5 bg-white p-2 rounded border border-slate-200">
                          {call.summary}
                        </p>
                      </div>
                    )}
                    {call.transcript && (
                      <div>
                        <span className="font-medium text-slate-500">Transcript:</span>
                        <pre className="text-caption text-slate-700 mt-0.5 bg-white p-2.5 rounded border border-slate-200 whitespace-pre-wrap font-sans">
                          {call.transcript}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No outbound calls made to this prospect yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Customer Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Customer"
        description="Convert this qualified prospect to a confirmed customer record. Reuses the authoritative contact without duplicating details."
      >
        <div className="space-y-4">
          <Input
            label="Total Deal / Contract Value (₹)"
            type="number"
            value={contractValue}
            onChange={(e) => setContractValue(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Conversion Notes</label>
            <textarea
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
              rows={3}
              value={convertNotes}
              onChange={(e) => setConvertNotes(e.target.value)}
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConvertModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConvertToCustomer}>Confirm Conversion</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
