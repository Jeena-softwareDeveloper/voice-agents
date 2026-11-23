'use client';

import React, { useEffect, useState } from 'react';
import { reportsApi } from '@/features/reports/api/reports.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, DataTableColumn } from '@/components/common/tables/DataTable';
import { StatusBadge } from '@/components/common/badges/StatusBadge';
import {
  TrendingUp,
  PhoneCall,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  Download,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/common/buttons/Button';

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

  const serviceColumns: DataTableColumn<any>[] = [
    {
      id: 'serviceName',
      header: 'Service Category',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-slate-900 block">{row.serviceName}</span>
          <span className="text-micro text-slate-400 block">{row.category}</span>
        </div>
      ),
    },
    {
      id: 'totalLeads',
      header: 'Total Leads',
      sortable: true,
      cell: (row) => <span className="font-bold text-xs text-slate-800">{row.totalLeads}</span>,
    },
    {
      id: 'totalCalls',
      header: 'AI Calls Dispatched',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-xs text-purple-700 bg-purple-50/70 border border-purple-200/60 px-2 py-0.5 rounded-full inline-block">
          {row.totalCalls}
        </span>
      ),
    },
    {
      id: 'converted',
      header: 'Converted Deals',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-xs text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-2 py-0.5 rounded-full inline-block">
          {row.converted}
        </span>
      ),
    },
    {
      id: 'conversionRate',
      header: 'Conversion %',
      sortable: true,
      cell: (row) => {
        const rate = row.totalLeads > 0 ? Math.round((row.converted / row.totalLeads) * 100) : 0;
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>{rate}%</span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive breakdown of service-wise lead acquisition, voice call connection rates, and conversion funnel."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Report
            </Button>
          </div>
        }
      />

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-slate-500 uppercase tracking-wider">
              Lead Conversion
            </span>
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{report?.conversionRate || 0}%</span>
            <span className="text-micro text-emerald-700 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-slate-500 uppercase tracking-wider">
              Connected Calls
            </span>
            <div className="w-6 h-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{report?.connectedCalls || 0}</span>
            <span className="text-micro text-slate-400 font-medium">92% connection rate</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-slate-500 uppercase tracking-wider">
              Qualified Leads
            </span>
            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{report?.qualifiedLeads || 0}</span>
            <span className="text-micro text-blue-700 font-semibold">Active interest</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-slate-500 uppercase tracking-wider">
              AI Minutes Used
            </span>
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{report?.aiCallingMinutes || 0}m</span>
            <span className="text-micro text-slate-400 font-medium">of 500m quota</span>
          </div>
        </div>
      </div>

      {/* 3. Service Breakdown Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-xs text-slate-900">Service Category Funnel Breakdown</h3>
          </div>
          <span className="text-caption text-slate-500">Live Telephony Aggregation</span>
        </div>
        <DataTable
          columns={serviceColumns}
          data={report?.serviceBreakdown || []}
          isLoading={isLoading}
          emptyTitle="No service statistics available"
          emptyDescription="Performance analytics will populate once leads and AI calling campaigns are underway."
        />
      </div>
    </div>
  );
}
