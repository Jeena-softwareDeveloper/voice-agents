'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { platformDashboardApi } from '@/features/platform-dashboard/api/dashboard.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import {
  Building2,
  Users,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Activity,
  Plus,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    platformDashboardApi
      .getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Spinner label="Loading Platform Overview..." className="py-20" />;
  }

  const stats = [
    { label: 'Total Clients', value: data?.totalClients || 0, sub: `${data?.activeClients || 0} active`, icon: Building2, color: 'text-brand-600 bg-brand-50' },
    { label: 'Total Leads Across Clients', value: data?.totalLeads || 0, sub: 'All registered prospects', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Total AI Outbound Calls', value: data?.totalCalls || 0, sub: `${data?.connectedCalls || 0} connected`, icon: PhoneCall, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Failed / Unanswered Calls', value: data?.failedCalls || 0, sub: 'Requires retry', icon: XCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Billable AI Minutes', value: `${data?.totalBillableMinutes || 0}m`, sub: `Provider Cost: ₹${data?.totalProviderCost || 0}`, icon: Clock, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Platform Revenue', value: `₹${data?.totalRevenue?.toLocaleString('en-IN') || 0}`, sub: `Pending: ₹${data?.pendingPayments?.toLocaleString('en-IN') || 0}`, icon: IndianRupee, color: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div>
      <PageHeader
        title="Platform Administration Dashboard"
        description="Comprehensive real-time telemetry across all multi-tenant client accounts, Sarvam AI telephony usage, and billing."
        actions={
          <Link href="/admin/clients/create">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Client Account</Button>
          </Link>
        }
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className="text-caption text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section: Recent Clients & Recent AI Calling Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600" /> Recent Client Tenants
            </h3>
            <Link href="/admin/clients" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All Clients
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentClients?.length ? (
              data.recentClients.map((client: any) => (
                <div key={client.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{client.name}</h4>
                    <p className="text-caption text-slate-500">{client.city}, {client.state} • {client.businessType}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded text-micro font-semibold ${
                      client.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {client.status}
                    </span>
                    <p className="text-micro text-slate-400 mt-0.5">{client._count?.leads || 0} leads • {client._count?.calls || 0} calls</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-500">No client accounts created yet.</p>
            )}
          </div>
        </div>

        {/* Recent AI Calling Activities */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" /> Recent AI Telephony Operations
            </h3>
            <Link href="/admin/calls" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View Calls Queue
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentCalls?.length ? (
              data.recentCalls.map((call: any) => (
                <div key={call.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{call.lead?.contact?.fullName || call.recipientNumber}</p>
                      <span className="text-micro font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {call.service?.name}
                      </span>
                    </div>
                    <p className="text-caption text-slate-500 mt-0.5">{call.tenant?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded text-micro font-bold ${
                      call.outcome === 'QUALIFIED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : call.outcome === 'INTERESTED'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {call.outcome || call.status}
                    </span>
                    <p className="text-micro text-slate-400 mt-0.5">{call.durationSeconds}s duration</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-500">No call operations recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
