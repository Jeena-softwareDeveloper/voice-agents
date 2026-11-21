'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { servicesApi } from '@/features/services/api/services.api';
import { Service } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/common/tables/Table';
import { Button } from '@/components/common/buttons/Button';
import { Plus, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';

export default function ClientServicesListPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    setIsLoading(true);
    servicesApi
      .getTenantServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const columns: Column<Service>[] = [
    {
      header: 'Service Category',
      cell: (s) => (
        <div>
          <div className="font-semibold text-slate-900">{s.name}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{s.category}</div>
        </div>
      ),
    },
    {
      header: 'Location / Scope',
      cell: (s) => <span className="text-xs text-slate-700">{s.location || 'Pan-India'}</span>,
    },
    {
      header: 'Pricing Information',
      cell: (s) => <span className="text-xs font-medium text-slate-800">{s.pricingInfo || 'Custom Quote'}</span>,
    },
    {
      header: 'Platform Admin Approval',
      cell: (s) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
            s.approvalStatus === 'APPROVED'
              ? 'bg-emerald-50 text-emerald-700'
              : s.approvalStatus === 'REJECTED'
              ? 'bg-red-50 text-red-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {s.approvalStatus === 'APPROVED' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {s.approvalStatus === 'APPROVED' ? 'Approved & AI Active' : 'Under Admin AI Review'}
        </span>
      ),
    },
    {
      header: 'Calling Status',
      cell: (s) => (
        <span
          className={`text-xs font-semibold ${
            s.approvalStatus === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          {s.approvalStatus === 'APPROVED' ? 'Eligible for Calling' : 'Locked until approval'}
        </span>
      ),
    },
    {
      header: 'Leads / Calls',
      cell: (s) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900">{s._count?.leads || 0}</span> leads /{' '}
          <span className="font-semibold text-slate-900">{s._count?.calls || 0}</span> calls
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (s) => (
        <Link href={`/workspace/services/${s.id}`}>
          <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
            View Service
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Service Categories"
        description="Create and organize your business services. Each service category is reviewed by the Platform Admin to map tailored Sarvam AI conversational scripts."
        actions={
          <Link href="/workspace/services/create">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Service</Button>
          </Link>
        }
      />

      <Table
        columns={columns}
        data={services}
        isLoading={isLoading}
        emptyTitle="No service categories created yet"
        emptyDescription="Create your first service category (e.g. Residential Plots, Apartments) to enable lead association and AI calling."
      />
    </div>
  );
}
