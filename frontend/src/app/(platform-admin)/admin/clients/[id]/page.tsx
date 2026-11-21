'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsApi } from '@/features/clients/api/clients.api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { Building2, PhoneCall, ShieldCheck, CheckCircle2, AlertTriangle, Layers, CreditCard } from 'lucide-react';

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = () => {
    setIsLoading(true);
    clientsApi
      .getById(clientId)
      .then(setClient)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleStatusChange = async (status: 'ACTIVE' | 'SUSPENDED') => {
    setIsUpdating(true);
    try {
      await clientsApi.updateStatus(clientId, status, client.aiCallingEnabled, client.monthlyCallingLimit);
      await loadClient();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAiCalling = async () => {
    setIsUpdating(true);
    try {
      await clientsApi.updateStatus(clientId, client.status, !client.aiCallingEnabled, client.monthlyCallingLimit);
      await loadClient();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading client details..." className="py-20" />;
  }

  if (!client) {
    return <div className="p-8 text-center text-slate-500">Client organization not found.</div>;
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        description={`Tenant ID: ${client.id} • Registered: ${new Date(client.createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Clients', href: '/admin/clients' },
          { label: client.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={client.aiCallingEnabled ? 'outline' : 'primary'}
              size="sm"
              onClick={handleToggleAiCalling}
              isLoading={isUpdating}
            >
              {client.aiCallingEnabled ? 'Disable AI Calling' : 'Enable AI Calling'}
            </Button>

            {client.status === 'ACTIVE' ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleStatusChange('SUSPENDED')}
                isLoading={isUpdating}
              >
                Suspend Account
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleStatusChange('ACTIVE')}
                isLoading={isUpdating}
              >
                Activate Account
              </Button>
            )}
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Account Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
              client.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {client.status}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Monthly Calling Limit</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{client.monthlyCallingLimit} mins</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Used Calling Minutes</p>
          <p className="text-xl font-bold text-purple-700 mt-1">{client.usedCallingMinutes || 0} mins</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Leads Registered</p>
          <p className="text-xl font-bold text-indigo-700 mt-1">{client._count?.leads || 0}</p>
        </div>
      </div>

      {/* Tabs / Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company & Business Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" /> Business Profile & Onboarding Answers
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <dt className="text-slate-400 font-medium">Business Email</dt>
              <dd className="font-semibold text-slate-800">{client.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Contact Phone</dt>
              <dd className="font-semibold text-slate-800">{client.phone}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Industry / Business Type</dt>
              <dd className="font-semibold text-slate-800">{client.businessType}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Operating Location</dt>
              <dd className="font-semibold text-slate-800">{client.city}, {client.state}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-400 font-medium">Primary Objective</dt>
              <dd className="font-normal text-slate-700 mt-0.5">
                {client.businessProfile?.primaryObjective || 'Automate outbound caller lead qualification.'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Registered Services & AI Conversation Mapping */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" /> Registered Service Categories ({client.services?.length || 0})
          </h3>
          <div className="space-y-3">
            {client.services?.length ? (
              client.services.map((service: any) => (
                <div key={service.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{service.name}</h4>
                    <p className="text-[11px] text-slate-500">{service.category}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      service.approvalStatus === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {service.approvalStatus}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{service._count?.leads || 0} leads</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No services created yet by this client.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
