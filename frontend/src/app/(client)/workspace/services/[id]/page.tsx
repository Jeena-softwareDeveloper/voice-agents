'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { servicesApi } from '@/features/services/api/services.api';
import { Service } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { Layers, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function ClientServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    servicesApi
      .getServiceById(serviceId)
      .then(setService)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [serviceId]);

  if (isLoading) {
    return <Spinner label="Loading service details..." className="py-20" />;
  }

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  return (
    <div>
      <PageHeader
        title={service.name}
        description={`Category: ${service.category} • Created: ${new Date((service as any).createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Services', href: '/workspace/services' },
          { label: service.name },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/workspace/services')}>
            Back to Services
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" /> Service Specifications
          </h3>
          <dl className="space-y-3 text-xs">
            <div>
              <dt className="text-slate-400 font-medium">Service Name</dt>
              <dd className="font-semibold text-slate-800 text-sm mt-0.5">{service.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Category</dt>
              <dd className="font-semibold text-slate-800 mt-0.5">{service.category}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Description</dt>
              <dd className="font-normal text-slate-700 mt-0.5">{service.description}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Location</dt>
              <dd className="font-semibold text-slate-800 mt-0.5">{service.location || 'Not Specified'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Pricing Details</dt>
              <dd className="font-semibold text-slate-800 mt-0.5">{service.pricingInfo || 'Not Specified'}</dd>
            </div>
          </dl>
        </div>

        {/* AI Calling Approval Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" /> AI Calling Configuration
          </h3>

          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${
                service.approvalStatus === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {service.approvalStatus === 'APPROVED' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              {service.approvalStatus === 'APPROVED'
                ? 'AI Conversation Active & Approved'
                : 'Pending Platform Admin Review'}
            </span>
          </div>

          {service.serviceAiConfig ? (
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Active AI Voice:</span>
                <span className="ml-2 font-semibold text-slate-800 capitalize">{service.serviceAiConfig.voice}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Language:</span>
                <span className="ml-2 font-semibold text-slate-800">{service.serviceAiConfig.language}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Opening Script Preview:</span>
                <p className="mt-1 text-slate-600 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                  {service.serviceAiConfig.openingIntro}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              The Platform Admin is reviewing this service to configure its AI conversation script and qualification questions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
