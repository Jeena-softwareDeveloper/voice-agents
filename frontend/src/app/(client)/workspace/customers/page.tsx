'use client';

import React, { useEffect, useState } from 'react';
import { customersApi } from '@/features/customers/api/customers.api';
import { Customer } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, DataTableColumn } from '@/components/common/tables/DataTable';
import { Users, IndianRupee, CheckCircle2 } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    customersApi
      .getCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const columns: DataTableColumn<Customer>[] = [
    {
      id: 'customer',
      header: 'Customer Name',
      sortable: true,
      cell: (c) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{c.contact.fullName}</span>
          <span className="font-mono text-caption text-slate-400 block">{c.contact.phone}</span>
        </div>
      ),
    },
    {
      id: 'contactInfo',
      header: 'Email & Location',
      cell: (c) => (
        <div>
          <span className="text-xs text-slate-800 block">{c.contact.email || '—'}</span>
          <span className="text-caption text-slate-400 block">{c.contact.location || '—'}</span>
        </div>
      ),
    },
    {
      id: 'service',
      header: 'Primary Service',
      sortable: true,
      cell: (c) => (
        <span className="font-semibold text-slate-800 text-xs">
          {c.primaryService?.name || 'General Product'}
        </span>
      ),
    },
    {
      id: 'value',
      header: 'Contract / Deal Value',
      sortable: true,
      cell: (c) => (
        <span className="text-xs font-bold text-emerald-700">
          ₹{Number(c.totalContractValue || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Account Status',
      sortable: true,
      cell: (c) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {c.status}
        </span>
      ),
    },
    {
      id: 'conversionDate',
      header: 'Conversion Date',
      sortable: true,
      cell: (c) => (
        <span className="text-xs text-slate-500">
          {new Date(c.conversionDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
  ];

  const renderMobileCustomerCard = (c: Customer) => (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-bold text-xs text-slate-900 block">{c.contact.fullName}</span>
          <span className="font-mono text-caption text-slate-500 block">{c.contact.phone}</span>
        </div>
        <span className="text-caption font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          ₹{Number(c.totalContractValue || 0).toLocaleString('en-IN')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-y border-slate-100 bg-slate-50/50 px-2 rounded">
        <div>
          <span className="text-micro uppercase font-semibold text-slate-400 block">Service</span>
          <span className="font-semibold text-slate-800 text-caption block truncate">
            {c.primaryService?.name || 'General Product'}
          </span>
        </div>
        <div>
          <span className="text-micro uppercase font-semibold text-slate-400 block">Converted</span>
          <span className="text-caption text-slate-600 block truncate">
            {new Date(c.conversionDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Customers"
        description="Active converted customer accounts and closed contracts generated from qualified leads."
        infoTooltip="Access customer profiles and their enquiry history. Leads that reach the 'Won' stage automatically convert to customers here."
        recordCount={customers.length}
        recordLabel="customers"
      />

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        renderMobileCard={renderMobileCustomerCard}
        emptyTitle="No converted customers yet"
        emptyDescription="When a qualified lead is moved to 'Won' in the Sales Pipeline, they appear here as converted customers."
      />
    </div>
  );
}
