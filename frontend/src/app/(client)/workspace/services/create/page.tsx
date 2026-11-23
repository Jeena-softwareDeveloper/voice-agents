'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { servicesApi, CreateServicePayload } from '@/features/services/api/services.api';
import { handleApiError } from '@/lib/api/error-handler';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { useToast } from '@/components/common/feedback/Toast';
import {
  Layers,
  UploadCloud,
  FileText,
  Sparkles,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  AlertTriangle,
  Info,
  Clock,
  ShieldCheck,
  Calendar,
  Check,
  ChevronRight,
  Edit2,
  HelpCircle,
  X,
} from 'lucide-react';

interface ExtractedInfo {
  pricingFound: string;
  isPricingExplicit: boolean;
  keyFeatures: string[];
  targetAudience: string;
  guaranteesAndPromises: string[];
  missingOrUnverified: string[];
  extractedSummary: string;
}

interface WorkflowStage {
  id?: string;
  order: number;
  name: string;
  triggerTiming: string;
  questions: string[];
  expectedResponse: string;
  nextAction: string;
  callbackScheduling: boolean;
  meetingScheduling: boolean;
  retryLimit: number;
  stopConditions: string;
}

export default function CreateServiceWizardPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic Details
  const [basicDetails, setBasicDetails] = useState({
    name: '',
    category: '',
    location: '',
    description: '',
    pricingInfo: '',
  });

  // Step 2: Marketing Materials & Gemini Extraction
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ fileName: string; fileType: string; fileSize?: number; rawContent?: string; fileUrl?: string }>
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({
    pricingFound: '',
    isPricingExplicit: false,
    keyFeatures: [],
    targetAudience: '',
    guaranteesAndPromises: [],
    missingOrUnverified: [],
    extractedSummary: '',
  });
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newGuaranteeText, setNewGuaranteeText] = useState('');

  // Step 3: AI Calling Configuration
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    openingGreeting: '',
    talkingPoints: [] as string[],
    qualificationQuestions: [] as Array<{
      id: string;
      question: string;
      expectedAnswerType: string;
      options?: string[];
      required: boolean;
    }>,
    faqs: [] as Array<{ question: string; answer: string }>,
    objectionHandling: [] as Array<{ objection: string; response: string }>,
    status: 'DRAFT',
  });

  const [newTalkingPoint, setNewTalkingPoint] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Step 4: Follow-up Workflow Stages
  const [isGeneratingStages, setIsGeneratingStages] = useState(false);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);

  // Stage Modal/Editing State
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);

  // Handlers for Step 2: Extraction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: typeof uploadedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      newFiles.push({
        fileName: f.name,
        fileType: f.type || 'application/pdf',
        fileSize: f.size,
        rawContent: `Marketing material attachment: ${f.name}`,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    success('Files Uploaded', `${files.length} document(s) added for Gemini analysis.`);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunGeminiExtraction = async () => {
    if (uploadedFiles.length === 0) {
      toastError('No Files Attached', 'Please upload at least one poster, brochure or PDF to extract.');
      return;
    }

    setIsExtracting(true);
    try {
      const result = await servicesApi.extractMarketingMaterial(uploadedFiles, {
        name: basicDetails.name,
        category: basicDetails.category,
        location: basicDetails.location,
        description: basicDetails.description,
      });

      if (result) {
        setExtractedInfo({
          pricingFound: result.pricingFound || 'Not specified in uploaded material',
          isPricingExplicit: Boolean(result.isPricingExplicit),
          keyFeatures: result.keyFeatures || [],
          targetAudience: result.targetAudience || 'Target customers for ' + basicDetails.name,
          guaranteesAndPromises: result.guaranteesAndPromises || [],
          missingOrUnverified: result.missingOrUnverified || [],
          extractedSummary: result.extractedSummary || 'Extracted summary',
        });
        if (result.pricingFound && result.pricingFound !== 'Not specified in uploaded material') {
          setBasicDetails((prev) => ({ ...prev, pricingInfo: result.pricingFound }));
        }
        success('Extraction Complete', 'Gemini successfully extracted verified service details.');
      }
    } catch (err: any) {
      toastError('Extraction Notice', handleApiError(err));
    } finally {
      setIsExtracting(false);
    }
  };

  // Handlers for Step 3: AI Calling Config Generation
  const handleRegenerateAiConfig = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await servicesApi.generateAiConfig(
        {
          name: basicDetails.name,
          category: basicDetails.category,
          location: basicDetails.location,
          description: basicDetails.description,
          pricingInfo: extractedInfo.pricingFound || basicDetails.pricingInfo,
        },
        extractedInfo,
      );

      if (res) {
        setAiConfig({
          openingGreeting: res.openingGreeting || aiConfig.openingGreeting,
          talkingPoints: res.talkingPoints || aiConfig.talkingPoints,
          qualificationQuestions: res.qualificationQuestions || aiConfig.qualificationQuestions,
          faqs: res.faqs || aiConfig.faqs,
          objectionHandling: Object.entries(res.objectionHandling || {}).map(([objection, response]) => ({
            objection,
            response: String(response),
          })),
          status: 'DRAFT',
        });
        success('AI Config Updated', 'Generated service-specific voice prompts, questions, and talking points.');
      }
    } catch (err: any) {
      toastError('AI Generation Failed', handleApiError(err));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handlers for Step 4: Workflow Stages
  const handleRegenerateWorkflowStages = async () => {
    setIsGeneratingStages(true);
    try {
      const stages = await servicesApi.generateWorkflowStages(
        {
          name: basicDetails.name,
          category: basicDetails.category,
          location: basicDetails.location,
        },
        extractedInfo,
      );

      if (stages && Array.isArray(stages)) {
        setWorkflowStages(stages);
        success('Workflow Stages Generated', `Created ${stages.length} sequential follow-up stages.`);
      }
    } catch (err: any) {
      toastError('Workflow Generation Failed', handleApiError(err));
    } finally {
      setIsGeneratingStages(false);
    }
  };

  const handleAddStage = () => {
    const nextOrder = workflowStages.length + 1;
    const newStage: WorkflowStage = {
      order: nextOrder,
      name: `Follow-up Stage ${nextOrder}`,
      triggerTiming: `Day ${nextOrder * 2}`,
      questions: ['Customer qualification question'],
      expectedResponse: 'Customer confirms next action.',
      nextAction: 'Schedule next consultation',
      callbackScheduling: true,
      meetingScheduling: false,
      retryLimit: 3,
      stopConditions: 'Customer requests removal / DND',
    };
    setWorkflowStages([...workflowStages, newStage]);
  };

  const handleDeleteStage = (index: number) => {
    if (workflowStages.length <= 1) {
      toastError('Minimum 1 Stage Required', 'A service must have at least one follow-up stage.');
      return;
    }
    const updated = workflowStages.filter((_, i) => i !== index).map((s, idx) => ({ ...s, order: idx + 1 }));
    setWorkflowStages(updated);
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === workflowStages.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...workflowStages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    // Re-index orders
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setWorkflowStages(reordered);
  };

  // Final Submission
  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basicDetails.name.trim() || !basicDetails.category.trim()) {
      toastError('Missing Details', 'Service name and category are required.');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateServicePayload = {
      name: basicDetails.name.trim(),
      category: basicDetails.category.trim(),
      description: basicDetails.description.trim(),
      location: basicDetails.location.trim(),
      marketLocation: basicDetails.location.trim(),
      pricingInfo: extractedInfo.pricingFound || basicDetails.pricingInfo,
      additionalInfo: `Target Audience: ${extractedInfo.targetAudience}`,
      extractedInfo,
      marketingMaterials: uploadedFiles,
      aiCallingConfig: {
        openingGreeting: aiConfig.openingGreeting,
        talkingPoints: aiConfig.talkingPoints,
        qualificationQuestions: aiConfig.qualificationQuestions,
        faqs: aiConfig.faqs,
        objectionHandling: aiConfig.objectionHandling.reduce(
          (acc, item) => ({ ...acc, [item.objection]: item.response }),
          {},
        ),
        status: aiConfig.status || 'DRAFT',
      },
      followUpStages: workflowStages,
    };

    try {
      const created = await servicesApi.createService(payload);
      success(
        'Service & Workflow Created',
        `'${created.name}' has been created with ${workflowStages.length} follow-up stages and AI calling configuration.`,
      );
      router.push('/workspace/services');
    } catch (err: any) {
      const msg = handleApiError(err);
      setError(msg);
      toastError('Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Create Service & AI Follow-up Workflow"
        description="Configure your offering with AI-powered marketing material extraction, conversational call prompts, and automated multi-stage follow-up sequences."
        breadcrumbs={[
          { label: 'Services', href: '/workspace/services' },
          { label: 'Create Service Wizard' },
        ]}
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4-Step Progress Indicator */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { step: 1, title: '1. Basic Details', desc: 'Offering & Market' },
            { step: 2, title: '2. Marketing Assets', desc: 'Gemini Extraction' },
            { step: 3, title: '3. AI Calling Setup', desc: 'Greeting & Questions' },
            { step: 4, title: '4. Follow-up Workflow', desc: 'Multi-stage Pipeline' },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step as any)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-blue-900' : isCompleted ? 'text-emerald-950' : 'text-slate-800'
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmitService} className="space-y-6">
        {/* ============================================================== */}
        {/* STEP 1: Basic Details                                          */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Step 1: Basic Service Information</h3>
                <p className="text-caption text-slate-400 mt-0.5">
                  Define your service name, industry category, target market, and core overview.
                </p>
              </div>
              <span className="text-caption font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Step 1 of 4
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={basicDetails.name}
                  onChange={(e) => setBasicDetails({ ...basicDetails, name: e.target.value })}
                  placeholder="e.g. Luxury Villa Sales, 3 BHK High-Rise Apartments"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all font-medium"
                />
                <p className="text-caption text-slate-400 mt-1">
                  The primary offering name spoken by the AI voice agent.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Category / Industry <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={basicDetails.category}
                  onChange={(e) => setBasicDetails({ ...basicDetails, category: e.target.value })}
                  placeholder="e.g. Real Estate & Infrastructure, Health & Wellness"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all font-medium"
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {['Real Estate & Infrastructure', 'Education & Coaching', 'Residential High-Rise', 'Healthcare'].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setBasicDetails({ ...basicDetails, category: cat })}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition"
                      >
                        {cat}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Location / Target Market
                </label>
                <input
                  type="text"
                  value={basicDetails.location}
                  onChange={(e) => setBasicDetails({ ...basicDetails, location: e.target.value })}
                  placeholder="e.g. Hinjawadi Phase 3, Pune / Pan-India"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all font-medium"
                />
                <p className="text-caption text-slate-400 mt-1">Geographic market or region serviced.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Pricing Indication (Initial)
                </label>
                <input
                  type="text"
                  value={basicDetails.pricingInfo}
                  onChange={(e) => setBasicDetails({ ...basicDetails, pricingInfo: e.target.value })}
                  placeholder="e.g. Starting at ₹1.8 Cr (or leave blank if in materials)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all font-medium"
                />
                <p className="text-caption text-slate-400 mt-1">
                  Can be extracted automatically from marketing brochures in Step 2.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Service Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={basicDetails.description}
                onChange={(e) => setBasicDetails({ ...basicDetails, description: e.target.value })}
                placeholder="Describe your service, key architectural features, target customer benefits, and project specs..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all font-medium leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <Button type="button" onClick={() => setCurrentStep(2)} className="rounded-lg gap-2 text-xs font-bold">
                Next: Marketing Materials
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: Marketing Materials & Gemini Extraction                 */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Step 2: Marketing Materials & Verification</h3>
                <p className="text-caption text-slate-400 mt-0.5">
                  Upload brochures, posters, or PDFs. Gemini will extract verified facts without inventing unmentioned claims.
                </p>
              </div>
              <span className="text-caption font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Step 2 of 4
              </span>
            </div>

            {/* Strict Factual Extraction Guarantee Alert */}
            <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Strict Factuality Guarantee</span>
                <p className="text-caption text-blue-800 mt-0.5 leading-relaxed">
                  Our system will never invent prices, specifications, or promises that are absent from your uploaded materials.
                  You have full control to verify and edit all extracted information before proceeding.
                </p>
              </div>
            </div>

            {/* File Upload Drop Area */}
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg p-6 text-center transition-colors bg-slate-50/50">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800 mb-1">
                Upload Brochures, Poster Images, or Project PDFs
              </div>
              <p className="text-caption text-slate-400 mb-3">
                Supports PDF, PNG, JPG, JPEG documents up to 25MB each
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition shadow-2xs">
                <span>Browse Files</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Attached Marketing Materials ({uploadedFiles.length})</span>
                  <button
                    type="button"
                    onClick={handleRunGeminiExtraction}
                    disabled={isExtracting}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isExtracting ? 'Extracting with Gemini...' : 'Re-extract with Gemini'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                        {file.fileSize && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Information Review Box */}
            <div className="border border-slate-200 rounded-lg p-5 space-y-4 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-slate-900">Extracted Information (Review & Edit)</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ready for AI Calling
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Confirmed Pricing Found
                  </label>
                  <input
                    type="text"
                    value={extractedInfo.pricingFound}
                    onChange={(e) => setExtractedInfo({ ...extractedInfo, pricingFound: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                  />
                  <p className="text-caption text-slate-400 mt-1">
                    Explicitly verified from document. Never invented by AI.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={extractedInfo.targetAudience}
                    onChange={(e) => setExtractedInfo({ ...extractedInfo, targetAudience: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                  />
                  <p className="text-caption text-slate-400 mt-1">Audience profile for call qualification.</p>
                </div>
              </div>

              {/* Key Features List */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">Key Verified Features</label>
                <div className="space-y-1.5">
                  {extractedInfo.keyFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...extractedInfo.keyFeatures];
                          updated[idx] = e.target.value;
                          setExtractedInfo({ ...extractedInfo, keyFeatures: updated });
                        }}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = extractedInfo.keyFeatures.filter((_, i) => i !== idx);
                          setExtractedInfo({ ...extractedInfo, keyFeatures: updated });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      placeholder="Add a verified feature from material..."
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newFeatureText.trim()) {
                          setExtractedInfo({
                            ...extractedInfo,
                            keyFeatures: [...extractedInfo.keyFeatures, newFeatureText.trim()],
                          });
                          setNewFeatureText('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                    >
                      Add Feature
                    </button>
                  </div>
                </div>
              </div>

              {/* Warranties & Guarantees */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Explicit Guarantees & Warranties Stated in Material
                </label>
                <div className="space-y-1.5">
                  {extractedInfo.guaranteesAndPromises.map((guar, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={guar}
                        onChange={(e) => {
                          const updated = [...extractedInfo.guaranteesAndPromises];
                          updated[idx] = e.target.value;
                          setExtractedInfo({ ...extractedInfo, guaranteesAndPromises: updated });
                        }}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = extractedInfo.guaranteesAndPromises.filter((_, i) => i !== idx);
                          setExtractedInfo({ ...extractedInfo, guaranteesAndPromises: updated });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing or Unverified Items Notice */}
              {extractedInfo.missingOrUnverified.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Items Absent in Material (The AI will NOT claim these):
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                    {extractedInfo.missingOrUnverified.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="rounded-lg gap-2 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back: Basic Details
              </Button>
              <Button type="button" onClick={() => setCurrentStep(3)} className="rounded-lg gap-2 text-xs font-bold">
                Next: AI Calling Setup
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: AI Calling Configuration                               */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Step 3: AI Calling Script & Question Configuration</h3>
                <p className="text-caption text-slate-400 mt-0.5">
                  Generated conversational flow, qualification questions, and objection handling based on your verified materials.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateAiConfig}
                  disabled={isGeneratingAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isGeneratingAi ? 'Regenerating...' : 'Regenerate with Gemini'}</span>
                </button>
                <span className="text-caption font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Step 3 of 4
                </span>
              </div>
            </div>

            {/* Opening Greeting */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Opening Greeting (Spoken upon call connect)
              </label>
              <textarea
                rows={2}
                value={aiConfig.openingGreeting}
                onChange={(e) => setAiConfig({ ...aiConfig, openingGreeting: e.target.value })}
                placeholder="e.g. Hello! This is your advisor calling regarding your recent enquiry. Do you have two minutes to speak?"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium leading-relaxed"
              />
              <p className="text-caption text-slate-400 mt-1">
                Polite greeting introducing your organization and service offering.
              </p>
            </div>

            {/* Talking Points */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-800">Service-Specific Talking Points</label>
              <div className="space-y-1.5">
                {aiConfig.talkingPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => {
                        const updated = [...aiConfig.talkingPoints];
                        updated[idx] = e.target.value;
                        setAiConfig({ ...aiConfig, talkingPoints: updated });
                      }}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = aiConfig.talkingPoints.filter((_, i) => i !== idx);
                        setAiConfig({ ...aiConfig, talkingPoints: updated });
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTalkingPoint}
                    onChange={(e) => setNewTalkingPoint(e.target.value)}
                    placeholder="Add a conversational talking point..."
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTalkingPoint.trim()) {
                        setAiConfig({
                          ...aiConfig,
                          talkingPoints: [...aiConfig.talkingPoints, newTalkingPoint.trim()],
                        });
                        setNewTalkingPoint('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                  >
                    Add Point
                  </button>
                </div>
              </div>
            </div>

            {/* Qualification Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800">
                  Customer Qualification Questions ({aiConfig.qualificationQuestions.length})
                </label>
                <span className="text-caption text-slate-400">Asked sequentially to assess buying readiness</span>
              </div>

              <div className="space-y-2.5">
                {aiConfig.qualificationQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-bold text-xs text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          Q{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...aiConfig.qualificationQuestions];
                            updated[idx].question = e.target.value;
                            setAiConfig({ ...aiConfig, qualificationQuestions: updated });
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = aiConfig.qualificationQuestions.filter((_, i) => i !== idx);
                          setAiConfig({ ...aiConfig, qualificationQuestions: updated });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-caption text-slate-500 pl-7">
                      <span>Type: <strong className="text-slate-700 uppercase">{q.expectedAnswerType}</strong></span>
                      {q.options && q.options.length > 0 && (
                        <span>Options: {q.options.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Enter new customer qualification question..."
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newQuestionText.trim()) {
                        setAiConfig({
                          ...aiConfig,
                          qualificationQuestions: [
                            ...aiConfig.qualificationQuestions,
                            {
                              id: `q-${Date.now()}`,
                              question: newQuestionText.trim(),
                              expectedAnswerType: 'choice',
                              options: ['Yes', 'No', 'Interested'],
                              required: true,
                            },
                          ],
                        });
                        setNewQuestionText('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                  >
                    Add Question
                  </button>
                </div>
              </div>
            </div>

            {/* FAQs & Objection Handling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Service FAQs</label>
                <div className="space-y-2">
                  {aiConfig.faqs.map((faq, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-slate-900 flex justify-between">
                        <span>{faq.question}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = aiConfig.faqs.filter((_, i) => i !== idx);
                            setAiConfig({ ...aiConfig, faqs: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-caption text-slate-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Objection Handling</label>
                <div className="space-y-2">
                  {aiConfig.objectionHandling.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-amber-900 flex justify-between">
                        <span>Customer says: &quot;{item.objection}&quot;</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = aiConfig.objectionHandling.filter((_, i) => i !== idx);
                            setAiConfig({ ...aiConfig, objectionHandling: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-caption text-slate-700">AI Response: {item.response}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Draft Status Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-slate-700 font-medium">
                  Configuration is saved as <strong>DRAFT</strong> until reviewed and approved.
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-blue-700">
                <input
                  type="checkbox"
                  checked={aiConfig.status === 'APPROVED'}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, status: e.target.checked ? 'APPROVED' : 'DRAFT' })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Approve Immediately upon Service Creation</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="rounded-lg gap-2 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back: Marketing Assets
              </Button>
              <Button type="button" onClick={() => setCurrentStep(4)} className="rounded-lg gap-2 text-xs font-bold">
                Next: Follow-up Workflow
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: Follow-up Workflow Builder                              */}
        {/* ============================================================== */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Step 4: Configurable Follow-up Workflow Builder</h3>
                <p className="text-caption text-slate-400 mt-0.5">
                  Define multi-stage customer progression from initial inquiry to final booking decision.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateWorkflowStages}
                  disabled={isGeneratingStages}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isGeneratingStages ? 'Regenerating...' : 'Reset Default Workflow'}</span>
                </button>
                <span className="text-caption font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Step 4 of 4
                </span>
              </div>
            </div>

            {/* Pipeline Stage Visual Flow */}
            {workflowStages.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-caption uppercase font-bold text-slate-400 block mb-2 tracking-wider">
                  Stage Sequence Pipeline
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
                  {workflowStages.map((stg, idx) => (
                    <React.Fragment key={idx}>
                      <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {stg.order}
                        </span>
                        <span className="text-slate-800">{stg.name}</span>
                      </div>
                      {idx < workflowStages.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Stage Cards with Full Configuration Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Configure Stages ({workflowStages.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Stage</span>
                </button>
              </div>

              {workflowStages.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/50 space-y-3">
                  <p className="text-xs text-slate-500">No follow-up stages added yet.</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddStage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Stage</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerateWorkflowStages}
                      disabled={isGeneratingStages}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isGeneratingStages ? 'Generating...' : 'Auto-Generate with AI'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                workflowStages.map((stage, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3.5 transition-all hover:border-slate-300"
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {stage.order}
                      </div>
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => {
                          const updated = [...workflowStages];
                          updated[idx].name = e.target.value;
                          setWorkflowStages(updated);
                        }}
                        className="text-xs font-bold text-slate-900 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded px-2 py-1 outline-none transition"
                        placeholder="Stage Name"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveStage(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100 transition"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStage(idx, 'down')}
                        disabled={idx === workflowStages.length - 1}
                        title="Move Down"
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100 transition"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStage(idx)}
                        title="Delete Stage"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Form Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Trigger Timing / Dependency
                      </label>
                      <input
                        type="text"
                        value={stage.triggerTiming}
                        onChange={(e) => {
                          const updated = [...workflowStages];
                          updated[idx].triggerTiming = e.target.value;
                          setWorkflowStages(updated);
                        }}
                        placeholder="e.g. Immediate, 24 hours after qualification"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Next Action on Successful Qualification
                      </label>
                      <input
                        type="text"
                        value={stage.nextAction}
                        onChange={(e) => {
                          const updated = [...workflowStages];
                          updated[idx].nextAction = e.target.value;
                          setWorkflowStages(updated);
                        }}
                        placeholder="e.g. Schedule Site Visit, Send Quotation"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Questions to Ask */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Questions to Ask Customer in this Stage
                    </label>
                    <textarea
                      rows={2}
                      value={stage.questions.join('\n')}
                      onChange={(e) => {
                        const updated = [...workflowStages];
                        updated[idx].questions = e.target.value.split('\n').filter((q) => q.trim().length > 0);
                        setWorkflowStages(updated);
                      }}
                      placeholder="One question per line..."
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 leading-relaxed font-mono text-[11px]"
                    />
                  </div>

                  {/* Expected Response & Stop Conditions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Expected Response / Qualification Criteria
                      </label>
                      <input
                        type="text"
                        value={stage.expectedResponse}
                        onChange={(e) => {
                          const updated = [...workflowStages];
                          updated[idx].expectedResponse = e.target.value;
                          setWorkflowStages(updated);
                        }}
                        placeholder="e.g. Customer confirms budget & weekend slot"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Stop Conditions (Exit Trigger)
                      </label>
                      <input
                        type="text"
                        value={stage.stopConditions}
                        onChange={(e) => {
                          const updated = [...workflowStages];
                          updated[idx].stopConditions = e.target.value;
                          setWorkflowStages(updated);
                        }}
                        placeholder="e.g. Customer not interested, DND requested"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Toggles & Retry limits */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={stage.callbackScheduling}
                          onChange={(e) => {
                            const updated = [...workflowStages];
                            updated[idx].callbackScheduling = e.target.checked;
                            setWorkflowStages(updated);
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Callback Scheduling</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={stage.meetingScheduling}
                          onChange={(e) => {
                            const updated = [...workflowStages];
                            updated[idx].meetingScheduling = e.target.checked;
                            setWorkflowStages(updated);
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Meeting / Site Visit Scheduling</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Retry Limit:</span>
                      <select
                        value={stage.retryLimit}
                        onChange={(e) => {
                          const updated = [...workflowStages];
                          updated[idx].retryLimit = Number(e.target.value);
                          setWorkflowStages(updated);
                        }}
                        className="border border-slate-200 rounded px-2 py-0.5 text-xs bg-white text-slate-800 outline-none"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num} attempts
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(3)} className="rounded-lg gap-2 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back: AI Calling Setup
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="rounded-lg gap-2 text-xs font-bold px-6 bg-blue-600 hover:bg-blue-700 text-white">
                <Check className="w-4 h-4" />
                Save & Launch Service Offering
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
