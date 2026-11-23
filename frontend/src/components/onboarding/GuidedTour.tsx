'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Layers,
  PlusCircle,
  PhoneCall,
  UploadCloud,
  Bot,
  GitBranch,
  CalendarCheck,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/common/buttons/Button';

export interface TourStep {
  id: string;
  stepNumber: number;
  title: string;
  badge: string;
  icon: React.ElementType;
  whatItIs: string;
  whyItIsUseful: string;
  whatYouNeedToDo: string;
  whatHappensNext: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    stepNumber: 1,
    title: 'Welcome to your AI CRM Workspace',
    badge: 'Getting Started',
    icon: Sparkles,
    whatItIs:
      'An enterprise multi-tenant customer relationship platform powered by AI voice agents for automated lead qualification and sales operations.',
    whyItIsUseful:
      'Eliminates manual prospecting by automatically calling inbound leads in fluent Indian languages, qualifying interest, and delivering ready-to-close customers to your team.',
    whatYouNeedToDo:
      'Follow this short 2-minute tour to learn the 4 essential steps: configure services, upload leads, monitor automated calling, and manage sales conversions.',
    whatHappensNext:
      'You will be fully prepared to manage leads and launch automated outbound calling campaigns.',
  },
  {
    id: 'dashboard',
    stepNumber: 2,
    title: 'Workspace Dashboard',
    badge: 'Platform Overview',
    icon: LayoutDashboard,
    whatItIs:
      'Your high-level command center displaying total enquiries, active calling campaigns, lead conversion percentages, and billable AI usage.',
    whyItIsUseful:
      'Gives you instant visibility into operational performance, call connection rates, and revenue pipeline at a glance.',
    whatYouNeedToDo:
      'Review daily conversion rates and monitor remaining AI calling minutes to keep campaigns running smoothly.',
    whatHappensNext:
      'Metrics update automatically in real-time as leads are contacted, qualified, and moved through your sales pipeline.',
  },
  {
    id: 'services',
    stepNumber: 3,
    title: 'Services & Products Catalog',
    badge: 'Core Business Setup',
    icon: Layers,
    whatItIs:
      'The catalogue of products or services offered by your company (e.g. Cloud Subscriptions, Health Checkup Plans, Financial Advisory, Real Estate Offerings).',
    whyItIsUseful:
      'The AI voice agent speaks intelligently only about approved services. Each service holds its own pricing, location, FAQs, and voice persona.',
    whatYouNeedToDo:
      'Create a service category with accurate pricing, key benefits, and location details.',
    whatHappensNext:
      'Platform Admin reviews and approves the AI conversation prompt, activating automated calling for that service.',
  },
  {
    id: 'create-service',
    stepNumber: 4,
    title: 'Creating an Offering',
    badge: 'Service Configuration',
    icon: PlusCircle,
    whatItIs:
      'The service creation form where you define offering descriptions, target locations, and pricing points.',
    whyItIsUseful:
      'Provides the factual foundation used by the AI voice agent to answer customer questions and handle objections during phone calls.',
    whatYouNeedToDo:
      'Click "Add Service", fill in the service title, category, pricing, and brief description, then submit.',
    whatHappensNext:
      'Your service appears in the Services list with status "Approved" once the AI script template is assigned.',
  },
  {
    id: 'calls',
    stepNumber: 5,
    title: 'Calls & Leads Management',
    badge: 'Lead Operations',
    icon: PhoneCall,
    whatItIs:
      'Your central leads table where enquiries from web forms, Facebook Ads, property portals, and Excel sheets are organized.',
    whyItIsUseful:
      'Allows you to inspect lead qualification levels, trigger instant AI voice calls, filter by service, and view detailed call recordings.',
    whatYouNeedToDo:
      'Upload leads or click "Add Lead", verify that Calling Consent is granted, and select the associated service.',
    whatHappensNext:
      'Leads are categorized and become eligible for one-click manual or bulk automated AI calling.',
  },
  {
    id: 'import',
    stepNumber: 6,
    title: 'Excel / CSV Lead Import',
    badge: 'Bulk Lead Upload',
    icon: UploadCloud,
    whatItIs:
      'A multi-step import wizard that ingests large spreadsheets of customer contact enquiries.',
    whyItIsUseful:
      'Saves hours of manual data entry by uploading hundreds of leads simultaneously with automatic duplicate prevention.',
    whatYouNeedToDo:
      'Download the sample CSV template, match your columns (Full Name, Phone, Email, Location), and select your target service.',
    whatHappensNext:
      'Uploaded leads are validated, saved under the selected service, and marked eligible for automated voice calls.',
  },
  {
    id: 'ai-calling',
    stepNumber: 7,
    title: 'AI Voice Calling & Telemetry',
    badge: 'Voice Automation',
    icon: Bot,
    whatItIs:
      'The call dispatch and telemetry hub showing all pending, active, completed, and failed outbound voice calls.',
    whyItIsUseful:
      'Provides audio recordings, complete bilingual transcripts (Hindi/English), and AI qualification notes for every connected customer.',
    whatYouNeedToDo:
      'Review completed calls, listen to audio previews, and inspect customer answers regarding budget, timeline, and location.',
    whatHappensNext:
      'Qualified leads are automatically advanced to the next sales stage for your sales team to follow up.',
  },
  {
    id: 'pipeline',
    stepNumber: 8,
    title: 'Sales Pipeline (Kanban)',
    badge: 'Deal Progression',
    icon: GitBranch,
    whatItIs:
      'An interactive visual board showing leads progressing through stages: New Lead → AI Contacted → Qualified → Interested → Meeting Scheduled → Negotiation → Won.',
    whyItIsUseful:
      'Ensures no customer enquiry slips through the cracks. Focuses your sales team on hot, qualified leads ready for closing.',
    whatYouNeedToDo:
      'Click on any lead card to view full details or click "Advance Stage" as customer negotiations proceed.',
    whatHappensNext:
      'Won leads are converted into Customers, and deal values are recorded in your company revenue analytics.',
  },
  {
    id: 'follow-ups',
    stepNumber: 9,
    title: 'Follow-ups & Task Scheduling',
    badge: 'Callback Management',
    icon: CalendarCheck,
    whatItIs:
      'A dedicated task queue for scheduled customer callbacks, site visits, document pickups, and sales meetings.',
    whyItIsUseful:
      'Keeps your sales reps accountable with categorized tabs: Today, Upcoming, Overdue, and Completed.',
    whatYouNeedToDo:
      'Execute scheduled callbacks on time and click "Mark Completed" with quick outcome notes.',
    whatHappensNext:
      'Task status is recorded in the customer activity timeline for complete team visibility.',
  },
  {
    id: 'reports',
    stepNumber: 10,
    title: 'Reports & Analytics',
    badge: 'Business Insights',
    icon: BarChart3,
    whatItIs:
      'Deep performance analytics breaking down service-wise lead acquisition, call connection rates, conversion percentages, and AI minutes consumed.',
    whyItIsUseful:
      'Identifies your best-performing service offerings, peak calling hours, and overall marketing ROI.',
    whatYouNeedToDo:
      'Review the funnel conversion rates monthly to optimize your marketing campaigns and calling strategies.',
    whatHappensNext:
      'Export formatted reports for management reviews and stakeholder updates.',
  },
];

interface GuidedTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ forceOpen = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Check on initial load if user has completed the tour
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      return;
    }
    const hasCompleted = localStorage.getItem('acrm_tour_completed');
    if (!hasCompleted) {
      // Show tour automatically for first-time user after 800ms
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleFinish = () => {
    localStorage.setItem('acrm_tour_completed', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('acrm_tour_completed', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const Icon = step.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / TOUR_STEPS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-micro font-bold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-1.5 py-0.5 rounded border border-blue-700/50">
                  {step.badge}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Step {step.stepNumber} of {TOUR_STEPS.length}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">{step.title}</h3>
            </div>
          </div>
          <button
            onClick={handleSkip}
            aria-label="Close tour"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content Body (Independently scrollable on small mobile screens) */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
          {/* What it is */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/90">
            <h4 className="font-bold text-slate-900 text-caption uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              What is this feature?
            </h4>
            <p className="text-slate-600 mt-1 leading-relaxed text-xs">{step.whatItIs}</p>
          </div>

          {/* Why it is useful */}
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
            <h4 className="font-bold text-emerald-900 text-caption uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Why is it useful?
            </h4>
            <p className="text-emerald-950 mt-1 leading-relaxed text-xs">{step.whyItIsUseful}</p>
          </div>

          {/* Two-column guidance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/70">
              <h5 className="font-bold text-blue-900 text-micro uppercase tracking-wider">
                What you need to do
              </h5>
              <p className="text-blue-950 mt-1 leading-relaxed text-caption">{step.whatYouNeedToDo}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200/70">
              <h5 className="font-bold text-purple-900 text-micro uppercase tracking-wider">
                What happens next
              </h5>
              <p className="text-purple-950 mt-1 leading-relaxed text-caption">{step.whatHappensNext}</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <div>
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1"
            >
              Skip Tour
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              rightIcon={
                isLast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
              }
            >
              {isLast ? 'Finish Tour' : 'Next Step'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
