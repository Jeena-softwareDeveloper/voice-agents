'use client';

import React, { useEffect, useState } from 'react';
import { customersApi } from '@/features/customers/api/customers.api';
import { Customer } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Users, CheckCircle2, IndianRupee } from 'lucide-react';

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

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Name',
      cell: (c) => (
        <div>
          <div className="font-semibold text-slate-900">{c.contact.fullName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{c.contact.phone}</div>
        </div>
      ),
    },
    {
      header: 'Email & Location',
      cell: (c) => (
        <div>
          <div className="text-xs text-slate-800">{c.contact.email || '-'}</div>
          <div className="text-[11px] text-slate-400">{c.contact.location || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Primary Service',
      cell: (c) => (
        <span className="font-semibold text-brand-700 text-xs">
          {c.primaryService?.name || 'General Product'}
        </span>
      ),
    },
    {
      header: 'Deal / Contract Value',
      cell: (c) => (
        <span className="text-xs font-bold text-emerald-700">
          ₹{Number(c.totalContractValue || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (c) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
          {c.status}
        </span>
      ),
    },
    {
      header: 'Conversion Date',
      cell: (c) => (
        <span className="text-xs text-slate-500">
          {new Date(c.conversionDate).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Converted Customers"
        description="Centralized directory of customers converted from qualified leads. Each record references the authoritative contact without duplicating phone numbers or profile data."
      />

      <Table
        columns={columns}
        data={customers}
        isLoading={isLoading}
        emptyTitle="No converted customers yet"
        emptyDescription="Leads marked as 'Won' or converted from Lead Details will appear here."
      />
    </div>
  );
}
