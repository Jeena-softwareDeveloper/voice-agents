'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/features/reports/api/reports.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import {
  Layers,
  Users,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Plus,
  ArrowRight,
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
    { label: 'Total Services', value: data?.serviceBreakdown?.length || 0, sub: 'Active Categories', icon: Layers, color: 'text-brand-600 bg-brand-50' },
    { label: 'Total Leads Registered', value: data?.totalLeads || 0, sub: 'Enquiries under services', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'AI Voice Calls Made', value: data?.totalCalls || 0, sub: `${data?.connectedCalls || 0} connected`, icon: PhoneCall, color: 'text-purple-600 bg-purple-50' },
    { label: 'Qualified Leads', value: data?.qualifiedLeads || 0, sub: 'Confirmed interest & budget', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Converted Customers', value: data?.convertedCustomers || 0, sub: `Rate: ${data?.conversionRate || 0}%`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'AI Minute Consumption', value: `${data?.aiCallingMinutes || 0}m`, sub: `Cost: ₹${data?.totalCallingCharges || 0}`, icon: Clock, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div>
      <PageHeader
        title="Workspace Overview"
        description="Monitor service-level performance, AI conversational calling results, sales pipeline qualification, and conversions."
        actions={
          <div className="flex gap-2">
            <Link href="/workspace/calls/import">
              <Button variant="outline" size="sm">Import Leads (CSV/Excel)</Button>
            </Link>
            <Link href="/workspace/services/create">
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>Add Service</Button>
            </Link>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Service-wise Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" /> Service Category Performance Breakdown
          </h3>
          <Link href="/workspace/services" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            Manage All Services
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.serviceBreakdown?.length ? (
            data.serviceBreakdown.map((s: any) => (
              <div key={s.serviceId} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{s.serviceName}</h4>
                  <p className="text-[11px] text-slate-500">{s.category}</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-right">
                  <div>
                    <span className="block font-bold text-slate-900">{s.totalLeads}</span>
                    <span className="text-[10px] text-slate-400">Leads</span>
                  </div>
                  <div>
                    <span className="block font-bold text-purple-600">{s.totalCalls}</span>
                    <span className="text-[10px] text-slate-400">Calls</span>
                  </div>
                  <div>
                    <span className="block font-bold text-emerald-600">{s.converted}</span>
                    <span className="text-[10px] text-slate-400">Customers</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-xs text-slate-500">No services created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
