'use client';

import React, { useEffect, useState } from 'react';
import { paymentsApi } from '@/features/payments/api/payments.api';
import { settingsApi } from '@/features/settings/api/settings.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Spinner } from '@/components/common/loaders/Spinner';
import { IndianRupee, CheckCircle2, Clock, AlertTriangle, TrendingUp, Sparkles, Layers } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [sarvamBilling, setSarvamBilling] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [paymentsRes, billingRes] = await Promise.all([
        paymentsApi.getPlatformOverview(),
        settingsApi.getSarvamBillingReport(),
      ]);
      setData(paymentsRes);
      setSarvamBilling(billingRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="space-y-6">
      <PageHeader
        title="Tenant Billing, AI Usage & Payment Collection"
        description="Unified financial oversight: Central Sarvam AI provider wholesale costs vs client selling prices, gross margin analysis, and tenant receivables."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Total Billed Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{data?.totalRevenue?.toLocaleString('en-IN') || 0}</p>
          <span className="text-caption text-slate-400">All tenant subscriptions & AI usage</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-purple-700">AI Calling Revenue</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            ₹{data?.totalAiCallingCharges?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-caption text-purple-600">Billed @ ₹1.80/min</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-emerald-700">Collected Payments</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{data?.paidAmount?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-caption text-emerald-600">Settled via gateway</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-amber-700">Outstanding / Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            ₹{data?.pendingAmount?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-caption text-amber-600">Due for collection</span>
        </div>
      </div>

      {/* Central Sarvam Telephony Expense vs Margin Card */}
      {sarvamBilling && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Sarvam AI Provider Expense vs Client Revenue Reconciliation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Wholesale platform provider expenditure at ₹0.95/min reconciled against client billings at ₹1.80/min.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              {sarvamBilling.grossMarginPercent}% Platform Margin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium block">Total Billable Minutes</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{sarvamBilling.totalBillableMinutes} mins</p>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200">
              <span className="text-rose-700 font-medium block">Sarvam Provider Expense</span>
              <p className="text-lg font-bold text-rose-900 mt-0.5">₹{sarvamBilling.totalProviderCost}</p>
              <span className="text-micro text-rose-600">Wholesale cost @ ₹0.95/min</span>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
              <span className="text-blue-700 font-medium block">Client Revenue Billed</span>
              <p className="text-lg font-bold text-blue-900 mt-0.5">₹{sarvamBilling.totalClientRevenue}</p>
              <span className="text-micro text-blue-600">Selling price @ ₹1.80/min</span>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 font-medium block">Gross Profit Margin</span>
              <p className="text-lg font-bold text-emerald-800 mt-0.5">₹{sarvamBilling.grossMargin}</p>
              <span className="text-micro text-emerald-600">Retained platform earnings</span>
            </div>
          </div>

          {/* Client-wise Breakdown Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg mt-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-caption border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Tenant Organization</th>
                  <th className="px-3 py-2.5">Total AI Calls</th>
                  <th className="px-3 py-2.5">Billable Minutes</th>
                  <th className="px-3 py-2.5">Sarvam Cost</th>
                  <th className="px-3 py-2.5">Client Revenue</th>
                  <th className="px-3 py-2.5">Platform Margin</th>
                  <th className="px-3 py-2.5">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sarvamBilling.clientWiseUsage?.map((u: any) => (
                  <tr key={u.tenantId} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{u.tenantName}</td>
                    <td className="px-3 py-2.5 text-slate-700">{u.totalCalls}</td>
                    <td className="px-3 py-2.5 font-semibold text-purple-700">{u.billableMinutes}m</td>
                    <td className="px-3 py-2.5 text-rose-700">₹{u.providerCost}</td>
                    <td className="px-3 py-2.5 font-bold text-blue-700">₹{u.clientRevenue}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-700">₹{u.margin}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">₹{u.creditBalance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">Tenant Billing Invoices Ledger</h3>
        <Table columns={columns} data={data?.invoices || []} isLoading={isLoading} emptyTitle="No invoices generated yet" />
      </div>
    </div>
  );
}
