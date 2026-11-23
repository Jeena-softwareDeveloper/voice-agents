'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/features/reports/api/reports.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { InfoTooltip } from '@/components/common/tooltips/InfoTooltip';
import {
  Layers,
  Users,
  PhoneCall,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  UploadCloud,
  Sparkles,
  Bot,
  HelpCircle,
} from 'lucide-react';

export default function ClientDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .getTenantReport()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Spinner label="Loading Workspace Overview..." className="py-20" />;
  }

  const stats = [
    {
      label: 'Active Services',
      value: data?.serviceBreakdown?.length || 0,
      sub: 'Approved offerings',
      icon: Layers,
      info: 'Total services with approved AI voice conversation scripts ready for calling.',
    },
    {
      label: 'Total Leads',
      value: data?.totalLeads || 0,
      sub: 'Enquiries recorded',
      icon: Users,
      info: 'Customer contacts uploaded from web forms, ads campaigns, and Excel spreadsheets.',
    },
    {
      label: 'AI Voice Calls',
      value: data?.totalCalls || 0,
      sub: `${data?.connectedCalls || 0} connected`,
      icon: PhoneCall,
      info: 'Total outbound calls placed by AI voice agents.',
    },
    {
      label: 'Qualified Leads',
      value: data?.qualifiedLeads || 0,
      sub: 'Budget & timing confirmed',
      icon: CheckCircle2,
      info: 'Prospects who confirmed high interest, verified budget, and purchase timeline.',
    },
    {
      label: 'Converted Customers',
      value: data?.convertedCustomers || 0,
      sub: `${data?.conversionRate || 0}% conversion`,
      icon: TrendingUp,
      info: 'Won customer accounts successfully closed from qualified leads.',
    },
    {
      label: 'AI Billable Mins',
      value: `${data?.aiCallingMinutes || 0}m`,
      sub: `Ledger: ₹${data?.totalCallingCharges || 0}`,
      icon: Clock,
      info: 'Total connected call duration billed at transparent per-minute rates.',
    },
  ];

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* 1. Page Header with Beginner Tooltip */}
      <PageHeader
        title="Workspace Dashboard"
        description="Operational overview of lead intake, AI voice outbound calling performance, and service category conversions."
        infoTooltip="This page provides a summary of your business activities and performance across leads, automated AI calling, and customer conversions."
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Link href="/workspace/calls">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Users className="w-3.5 h-3.5" />}
                title="View your leads table"
              >
                View Leads
              </Button>
            </Link>
            <Link href="/workspace/services/create">
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                title="Register a new service offering"
              >
                Add Service
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Beginner-Friendly Roadmap Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-xl border border-blue-800/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">How AI Voice Calling Works</span>
              <span className="text-micro bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.2 rounded border border-emerald-500/30">
                Automated
              </span>
            </div>
            <p className="text-caption text-blue-200 mt-0.5 leading-relaxed">
              1. Add Services → 2. Upload Leads → 3. Trigger AI Voice Outbound Calls → 4. Close Qualified Deals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <Link href="/workspace/calls">
            <button className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1">
              Start Calling <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      {/* 3. Enterprise Responsive KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-micro sm:text-caption font-semibold text-slate-500 uppercase tracking-tight truncate">
                  {stat.label}
                </span>
                <InfoTooltip content={stat.info} size="xs" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none">{stat.value}</p>
              <p className="text-micro text-slate-400 mt-1 truncate">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* 4. Service-wise Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900">Service Category Performance</h3>
            <InfoTooltip
              content="Each service can have its own AI conversation and associated leads."
              size="xs"
            />
          </div>
          <Link
            href="/workspace/services"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            Manage Services <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Mobile View: Cards (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {data?.serviceBreakdown?.length ? (
            data.serviceBreakdown.map((s: any) => (
              <div key={s.serviceId} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{s.serviceName}</h4>
                    <span className="text-micro text-slate-500">{s.category}</span>
                  </div>
                  <Link
                    href={`/workspace/services/${s.serviceId}`}
                    className="text-xs text-blue-600 font-semibold"
                  >
                    Details →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2 rounded text-xs">
                  <div>
                    <span className="text-micro text-slate-400 block uppercase font-semibold">Leads</span>
                    <span className="font-bold text-slate-900">{s.totalLeads}</span>
                  </div>
                  <div>
                    <span className="text-micro text-purple-600 block uppercase font-semibold">AI Calls</span>
                    <span className="font-bold text-purple-700">{s.totalCalls}</span>
                  </div>
                  <div>
                    <span className="text-micro text-emerald-600 block uppercase font-semibold">Won</span>
                    <span className="font-bold text-emerald-700">{s.converted}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">No services registered.</div>
          )}
        </div>

        {/* Desktop / Tablet View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-micro font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Service Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Total Leads</th>
                <th className="px-4 py-2.5 text-right">AI Calls Made</th>
                <th className="px-4 py-2.5 text-right">Converted</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data?.serviceBreakdown?.length ? (
                data.serviceBreakdown.map((s: any) => (
                  <tr key={s.serviceId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{s.serviceName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{s.category}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{s.totalLeads}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-purple-700">{s.totalCalls}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{s.converted}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/workspace/services/${s.serviceId}`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No services registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
