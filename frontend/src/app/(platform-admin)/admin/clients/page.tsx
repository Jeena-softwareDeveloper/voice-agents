'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientsApi } from '@/features/clients/api/clients.api';
import { Tenant } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Button } from '@/components/common/buttons/Button';
import { Plus, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminClientsListPage() {
  const [clients, setClients] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    setIsLoading(true);
    clientsApi
      .getAll()
      .then(setClients)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const columns: Column<Tenant>[] = [
    {
      header: 'Company Name',
      cell: (t) => (
        <div>
          <div className="font-semibold text-slate-900">{t.name}</div>
          <div className="text-caption text-slate-400 font-mono">ID: {t.id.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      header: 'Tenant ID / Slug',
      accessorKey: 'slug',
      className: 'font-mono text-xs text-slate-600',
    },
    {
      header: 'Email & Contact',
      cell: (t) => (
        <div>
          <div className="text-xs text-slate-800">{t.email}</div>
          <div className="text-caption text-slate-400">{t.phone}</div>
        </div>
      ),
    },
    {
      header: 'Subscription Plan',
      cell: (t) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          {t.subscription?.planName || 'Enterprise AI'}
        </span>
      ),
    },
    {
      header: 'Account Status',
      cell: (t) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
            t.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700'
              : t.status === 'PENDING'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {t.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {t.status}
        </span>
      ),
    },
    {
      header: 'AI Calling',
      cell: (t) => (
        <span
          className={`text-xs font-semibold ${
            t.aiCallingEnabled ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          {t.aiCallingEnabled ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Leads / Calls',
      cell: (t) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900">{t._count?.leads || 0}</span> leads /{' '}
          <span className="font-semibold text-slate-900">{t._count?.calls || 0}</span> calls
        </div>
      ),
    },
    {
      header: 'Created Date',
      cell: (t) => (
        <span className="text-xs text-slate-500">
          {new Date(t.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (t) => (
        <Link href={`/admin/clients/${t.id}`}>
          <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Manage
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Client Accounts & Onboarding"
        description="Comprehensive management of multi-tenant client companies, administrator accounts, calling limits, and lifecycle status."
        actions={
          <Link href="/admin/clients/create">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Client</Button>
          </Link>
        }
      />

      <Table columns={columns} data={clients} isLoading={isLoading} emptyTitle="No client accounts registered" />
    </div>
  );
}
