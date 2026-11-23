'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Button } from '@/components/common/buttons/Button';
import { Modal } from '@/components/common/modals/Modal';
import { Select } from '@/components/common/dropdowns/Select';
import { Input } from '@/components/common/inputs/Input';
import { Spinner } from '@/components/common/loaders/Spinner';
import { leadsApi } from '@/features/lead-management/api/leads.api';
import { servicesApi } from '@/features/services/api/services.api';
import { aiCallingApi } from '@/features/ai-calling/api/ai-calling.api';
import { Lead, Service, Call } from '@/types';
import {
  BarChart2,
  Users,
  UploadCloud,
  Layers,
  Sparkles,
  ListOrdered,
  History,
  Activity,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

type TabType =
  | 'overview'
  | 'all-leads'
  | 'import-export'
  | 'services'
  | 'ai-conversations'
  | 'calling-queue'
  | 'call-history'
  | 'call-monitoring';

export default function AdminCallsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Approval modal state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Form for AI Configuration Approval
  const [aiForm, setAiForm] = useState({
    openingIntro: 'Namaste! Main {companyName} se baat kar rahi hoon. Aapne enquiry ki thi.',
    companyIdentity: '',
    serviceDescription: '',
    instructions: 'Politely qualify the lead, inquire about budget and timeline, and offer a meeting.',
    language: 'hi-IN',
    voice: 'default',
    maxDurationSeconds: 300,
    closingStatement: 'Dhanyawad! Hamari sales team aapse jald hi sampark karegi.',
  });

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: TabType) => {
    setIsLoading(true);
    try {
      if (tab === 'overview' || tab === 'call-monitoring') {
        const ov = await aiCallingApi.getCallsOverview();
        setOverview(ov);
      }
      if (tab === 'all-leads') {
        const l = await leadsApi.getAllAdminLeads();
        setLeads(l);
      }
      if (tab === 'services') {
        const s = await servicesApi.getAllAdminServices();
        setServices(s);
      }
      if (tab === 'ai-conversations') {
        const t = await servicesApi.getAiTemplates();
        setTemplates(t);
      }
      if (tab === 'calling-queue') {
        const q = await aiCallingApi.getAdminCallHistory({ status: 'QUEUED' });
        setCalls(q);
      }
      if (tab === 'call-history' || tab === 'call-monitoring') {
        const h = await aiCallingApi.getAdminCallHistory();
        setCalls(h);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenApproveModal = (service: Service) => {
    setSelectedService(service);
    setAiForm({
      openingIntro: `Namaste! Main ${service.name} ke baare mein baat kar rahi hoon.`,
      companyIdentity: (service as any).tenant?.name || 'Our Company',
      serviceDescription: service.description,
      instructions: 'Introduce the project, ask about preferred location and budget, and invite for a visit.',
      language: 'hi-IN',
      voice: 'default',
      maxDurationSeconds: 300,
      closingStatement: 'Dhanyawad! Hamare representative aapko brochure WhatsApp kar rahe hain.',
    });
    setTestResult(null);
    setIsApproveModalOpen(true);
  };

  const handleApproveAi = async () => {
    if (!selectedService) return;
    try {
      await servicesApi.approveAiConfig({
        serviceId: selectedService.id,
        ...aiForm,
        qualificationQuestions: [
          { id: 'q1', question: 'Aapka budget range kya hai?', expectedAnswerType: 'choice' },
          { id: 'q2', question: 'Kya aap is weekend visit kar sakte hain?', expectedAnswerType: 'yes_no' },
        ],
        approvedResponses: {
          pricing: serviceDescriptionOrPlaceholder(selectedService.pricingInfo),
        },
        objectionHandling: {
          not_now: 'Main samajh sakti hoon, kya main WhatsApp par details share kar doon?',
        },
      });
      setIsApproveModalOpen(false);
      loadTabData('services');
    } catch (err) {
      console.error(err);
    }
  };

  const serviceDescriptionOrPlaceholder = (info?: string) => info || 'Pricing details available on enquiry.';

  const tabs: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'all-leads', label: 'All Leads', icon: Users },
    { id: 'import-export', label: 'Import / Export', icon: UploadCloud },
    { id: 'services', label: 'Services Approval', icon: Layers },
    { id: 'ai-conversations', label: 'AI Conversations', icon: Sparkles },
    { id: 'calling-queue', label: 'Calling Queue', icon: ListOrdered },
    { id: 'call-history', label: 'Call History', icon: History },
    { id: 'call-monitoring', label: 'Call Monitoring', icon: Activity },
  ];

  // Table columns for All Leads
  const leadColumns: Column<Lead>[] = [
    {
      header: 'Prospect Name',
      cell: (l) => (
        <div>
          <div className="font-semibold text-slate-900">{l.contact.fullName}</div>
          <div className="text-caption text-slate-400 font-mono">{l.contact.phone}</div>
        </div>
      ),
    },
    {
      header: 'Tenant Client',
      cell: (l) => <span className="font-medium text-slate-800">{l.tenant?.name || '-'}</span>,
    },
    {
      header: 'Service Category',
      cell: (l) => (
        <div>
          <span className="font-semibold text-brand-700">{l.service?.name}</span>
          <div className="text-caption text-slate-400">{l.service?.category}</div>
        </div>
      ),
    },
    {
      header: 'Stage',
      cell: (l) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
          {l.status}
        </span>
      ),
    },
    {
      header: 'Calling Eligible',
      cell: (l) => (
        <span className={`text-xs font-semibold ${l.aiCallingEligible ? 'text-emerald-600' : 'text-slate-400'}`}>
          {l.aiCallingEligible ? 'Eligible' : 'Ineligible'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      cell: (l) => <span className="text-xs text-slate-500">{new Date((l as any).createdAt).toLocaleDateString()}</span>,
    },
  ];

  // Table columns for Services
  const serviceColumns: Column<Service>[] = [
    {
      header: 'Service Name',
      cell: (s) => (
        <div>
          <div className="font-semibold text-slate-900">{s.name}</div>
          <div className="text-caption text-slate-500">{s.category}</div>
        </div>
      ),
    },
    {
      header: 'Client Tenant',
      cell: (s) => <span className="font-medium text-slate-800">{(s as any).tenant?.name || '-'}</span>,
    },
    {
      header: 'Approval Status',
      cell: (s) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
            s.approvalStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {s.approvalStatus === 'APPROVED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {s.approvalStatus}
        </span>
      ),
    },
    {
      header: 'AI Calling Bound',
      cell: (s) => (
        <span className="text-xs text-purple-700 font-medium">
          {s.serviceAiConfig ? `v${s.serviceAiConfig.version} (${s.serviceAiConfig.voice})` : 'Not Configured'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (s) => (
        <Button
          size="sm"
          variant={s.approvalStatus === 'APPROVED' ? 'outline' : 'primary'}
          onClick={() => handleOpenApproveModal(s)}
        >
          {s.approvalStatus === 'APPROVED' ? 'Reconfigure AI' : 'Configure & Approve AI'}
        </Button>
      ),
    },
  ];

  // Table columns for Calls
  const callColumns: Column<Call>[] = [
    {
      header: 'Recipient',
      cell: (c) => (
        <div>
          <div className="font-semibold text-slate-900">{c.lead?.contact?.fullName || c.recipientNumber}</div>
          <div className="text-caption text-slate-400 font-mono">{c.recipientNumber}</div>
        </div>
      ),
    },
    {
      header: 'Client Tenant',
      cell: (c) => <span className="font-medium text-slate-800">{c.tenant?.name || '-'}</span>,
    },
    {
      header: 'Service',
      cell: (c) => <span className="text-xs font-medium text-slate-700">{c.service?.name}</span>,
    },
    {
      header: 'Outcome',
      cell: (c) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
            c.outcome === 'QUALIFIED'
              ? 'bg-emerald-50 text-emerald-700'
              : c.outcome === 'INTERESTED'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {c.outcome || c.status}
        </span>
      ),
    },
    {
      header: 'Duration',
      cell: (c) => <span className="text-xs text-slate-600">{c.durationSeconds}s</span>,
    },
    {
      header: 'Billable Cost',
      cell: (c) => <span className="text-xs font-semibold text-slate-900">₹{c.costAmount}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Calls & Lead Operations Control"
        description="Platform-wide control over all tenant leads, service category approvals, Sarvam AI conversation prompt configurations, calling queues, and call telemetry."
      />

      {/* Internal Tabs Navigation */}
      <div className="flex items-center space-x-1 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Total Leads Registered</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview?.totalLeads || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Connected Voice Calls</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{overview?.connectedCalls || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Total Billable Minutes</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{overview?.totalBillableMinutes || 0}m</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Use the internal tabs above to review leads, approve client services, manage conversation prompts, and inspect queue states.
          </p>
        </div>
      )}

      {activeTab === 'all-leads' && (
        <Table columns={leadColumns} data={leads} isLoading={isLoading} emptyTitle="No leads in platform" />
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            When a tenant registers a new service category, it appears here. Only approved services with active AI conversation configurations can initiate outbound automated calling.
          </p>
          <Table columns={serviceColumns} data={services} isLoading={isLoading} emptyTitle="No services submitted" />
        </div>
      )}

      {activeTab === 'ai-conversations' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Pre-Configured AI Conversation Templates</h3>
            <p className="text-xs text-slate-500 mb-4">
              System templates providing standardized qualification questions, objection handling, and voice configurations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <span className="text-micro bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-semibold">
                      {t.industry}
                    </span>
                  </div>
                  <p className="text-caption text-slate-600 mb-3">{t.description}</p>
                  <div className="text-micro text-slate-500 font-mono bg-white p-2 rounded border border-slate-200 line-clamp-2">
                    {t.openingIntro}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'calling-queue' || activeTab === 'call-history' || activeTab === 'call-monitoring') && (
        <Table columns={callColumns} data={calls} isLoading={isLoading} emptyTitle="No call records found" />
      )}

      {activeTab === 'import-export' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Import / Export Operations</h3>
          <p className="text-xs text-slate-500">
            Platform administrators can audit lead batch imports across client workspaces and download audit logs.
          </p>
        </div>
      )}

      {/* AI Approval & Configuration Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title={`Configure & Approve AI Calling: ${selectedService?.name}`}
        description="Establish the Sarvam AI conversation script, voice, qualification questions, and objection handling."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <Input
            label="Company Identity Display"
            value={aiForm.companyIdentity}
            onChange={(e) => setAiForm({ ...aiForm, companyIdentity: e.target.value })}
            placeholder="Company Brand Name"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">AI Opening Introduction</label>
            <textarea
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
              rows={2}
              value={aiForm.openingIntro}
              onChange={(e) => setAiForm({ ...aiForm, openingIntro: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Description</label>
            <textarea
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
              rows={2}
              value={aiForm.serviceDescription}
              onChange={(e) => setAiForm({ ...aiForm, serviceDescription: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Managed AI Engine</label>
              <div className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium">
                Sarvam Voice Agents (Bulbul V4 + Saaras v4)
              </div>
            </div>
            <Select
              label="Primary Language"
              options={[
                { value: 'hi-IN', label: 'Hindi (India)' },
                { value: 'en-IN', label: 'English (Indian Accent)' },
                { value: 'ta-IN', label: 'Tamil (India)' },
                { value: 'mr-IN', label: 'Marathi (India)' },
              ]}
              value={aiForm.language}
              onChange={(e) => setAiForm({ ...aiForm, language: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsTesting(true);
                try {
                  const res = await servicesApi.approveAiConfig({
                    serviceId: selectedService!.id,
                    ...aiForm,
                    qualificationQuestions: [],
                    approvedResponses: {},
                    objectionHandling: {},
                  });
                  const testRes = await servicesApi.testConversation(res.id);
                  setTestResult(testRes);
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsTesting(false);
                }
              }}
              isLoading={isTesting}
            >
              Test Conversation
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApproveAi}>
                Approve & Publish Service AI
              </Button>
            </div>
          </div>

          {testResult && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <p className="font-semibold text-slate-800 mb-1">Simulated Conversation Test Result:</p>
              <pre className="text-caption text-slate-700 whitespace-pre-wrap font-sans bg-white p-2 rounded border border-slate-100">
                {testResult.testTranscript}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
