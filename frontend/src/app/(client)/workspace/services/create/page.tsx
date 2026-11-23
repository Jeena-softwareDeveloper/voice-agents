'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { servicesApi, CreateServicePayload } from '@/features/services/api/services.api';
import { handleApiError } from '@/lib/api/error-handler';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { Layers, ArrowRight, Info } from 'lucide-react';

export default function CreateServicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateServicePayload>({
    name: '',
    category: '',
    description: '',
    location: '',
    pricingInfo: '',
    additionalInfo: '',
  });

  const handleChange = (field: keyof CreateServicePayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await servicesApi.createService(form);
      router.push('/workspace/services');
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Service Category"
        description="Define a new service offering. Once submitted, Platform Admin will configure the AI conversation prompt and approve automated calling."
        infoTooltip="Each service can have its own AI conversation and associated leads. Enter accurate details so the AI voice agent can represent your product effectively."
        breadcrumbs={[
          { label: 'Services', href: '/workspace/services' },
          { label: 'Create Service' },
        ]}
      />

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-2xs max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <Input
              label="Service Name"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Cloud Infrastructure Consulting / Health Checkup Plan / Premium Advisory"
            />
            <p className="text-caption text-slate-500 mt-1">
              Enter the name of the product or service associated with these customer enquiries.
            </p>
          </div>

          <div>
            <Input
              label="Service Category / Industry"
              required
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="e.g. SaaS & Cloud / Healthcare / Financial Services / Real Estate / Professional Services"
            />
            <p className="text-caption text-slate-500 mt-1">
              Categorizes your offering for specialized AI conversation templates.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed text-slate-900"
              placeholder="Explain key features, deliverables, specifications, and primary customer benefits..."
            />
            <p className="text-caption text-slate-500 mt-1">
              Explain what this service offers. This information helps configure the appropriate AI conversation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Input
                label="Location / Region"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. Pan-India / Regional / Mumbai / Remote"
              />
              <p className="text-caption text-slate-500 mt-1">
                Target geographic market or delivery location.
              </p>
            </div>

            <div>
              <Input
                label="Pricing Information"
                value={form.pricingInfo}
                onChange={(e) => handleChange('pricingInfo', e.target.value)}
                placeholder="e.g. Starting from ₹10,000 / Custom Quote"
              />
              <p className="text-caption text-slate-500 mt-1">
                Base price or starting range for lead qualification.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Details / FAQs
            </label>
            <textarea
              rows={2}
              value={form.additionalInfo}
              onChange={(e) => handleChange('additionalInfo', e.target.value)}
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed text-slate-900"
              placeholder="RERA numbers, possession dates, bank loan approvals (SBI, HDFC), or special offers..."
            />
            <p className="text-caption text-slate-500 mt-1">
              The AI voice agent will use these answers when prospects ask specific questions on phone calls.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/workspace/services')}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Submit Offering
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
