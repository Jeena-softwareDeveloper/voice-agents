'use client';

import React, { useEffect, useState } from 'react';
import { paymentsApi } from '@/features/payments/api/payments.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Spinner } from '@/components/common/loaders/Spinner';
import { IndianRupee, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    paymentsApi
      .getPlatformOverview()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Spinner label="Loading billing & payment ledger..." className="py-20" />;
  }

  const columns: Column<any>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      className: 'font-mono text-xs font-bold text-slate-900',
    },
    {
      header: 'Client Tenant',
      cell: (inv) => <span className="font-medium text-slate-800">{inv.tenant?.name || '-'}</span>,
    },
    {
      header: 'AI Calling Minutes',
      cell: (inv) => <span className="text-xs font-semibold text-purple-700">{inv.callingMinutes} mins</span>,
    },
    {
      header: 'Calling Charges',
      cell: (inv) => <span className="text-xs text-slate-800">₹{inv.callingCharges}</span>,
    },
    {
      header: 'Subscription Charges',
      cell: (inv) => <span className="text-xs text-slate-800">₹{inv.subscriptionCharges}</span>,
    },
    {
      header: 'Total Invoiced',
      cell: (inv) => <span className="text-xs font-bold text-slate-900">₹{inv.totalAmount}</span>,
    },
    {
      header: 'Amount Paid',
      cell: (inv) => <span className="text-xs font-semibold text-emerald-600">₹{inv.amountPaid}</span>,
    },
    {
      header: 'Payment Status',
      cell: (inv) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
            inv.status === 'PAID'
              ? 'bg-emerald-50 text-emerald-700'
              : inv.status === 'OVERDUE'
              ? 'bg-red-50 text-red-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {inv.status}
        </span>
      ),
    },
    {
      header: 'Due Date',
      cell: (inv) => <span className="text-xs text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tenant Billing & Payment Collection"
        description="Unified financial oversight: AI minute usage reconciliation, subscription billing, invoiced receivables, and gateway settlements."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total Billed Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{data?.totalRevenue?.toLocaleString('en-IN') || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">AI Usage Revenue</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            ₹{data?.totalAiCallingCharges?.toLocaleString('en-IN') || 0}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Collected Payments</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{data?.paidAmount?.toLocaleString('en-IN') || 0}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Outstanding / Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            ₹{data?.pendingAmount?.toLocaleString('en-IN') || 0}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Tenant Billing Ledger & Invoices</h3>
        <Table columns={columns} data={data?.invoices || []} isLoading={isLoading} emptyTitle="No invoices generated yet" />
      </div>
    </div>
  );
}
