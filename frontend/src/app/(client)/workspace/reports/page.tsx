'use client';

import React, { useEffect, useState } from 'react';
import { reportsApi } from '@/features/reports/api/reports.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Table, Column } from '@/components/common/tables/Table';
import { BarChart3, TrendingUp, PhoneCall, CheckCircle2, Clock } from 'lucide-react';

export default function ClientReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .getTenantReport()
      .then(setReport)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Spinner label="Generating performance analytics..." className="py-20" />;
  }

  const serviceColumns: Column<any>[] = [
    {
      header: 'Service Category',
      accessorKey: 'serviceName',
      className: 'font-semibold text-slate-900',
    },
    {
      header: 'Industry / Type',
      accessorKey: 'category',
      className: 'text-xs text-slate-500',
    },
    {
      header: 'Total Leads',
      accessorKey: 'totalLeads',
      className: 'text-xs font-bold text-slate-800',
    },
    {
      header: 'AI Calls Dispatched',
      accessorKey: 'totalCalls',
      className: 'text-xs font-bold text-purple-700',
    },
    {
      header: 'Customers Converted',
      accessorKey: 'converted',
      className: 'text-xs font-bold text-emerald-700',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Business & AI Calling Analytics"
        description="Comprehensive breakdown of service-wise lead acquisition, voice call connection rates, qualification funnel performance, and billable AI minutes."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Overall Lead Conversion</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{report?.conversionRate || 0}%</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Connected AI Calls</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{report?.connectedCalls || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Qualified Leads</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{report?.qualifiedLeads || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">AI Billable Minutes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{report?.aiCallingMinutes || 0}m</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Service Category Funnel Breakdown</h3>
        <Table
          columns={serviceColumns}
          data={report?.serviceBreakdown || []}
          emptyTitle="No service statistics available"
        />
      </div>
    </div>
  );
}
