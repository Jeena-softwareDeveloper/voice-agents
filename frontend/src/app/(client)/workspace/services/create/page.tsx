'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { servicesApi, CreateServicePayload } from '@/features/services/api/services.api';
import { handleApiError } from '@/lib/api/error-handler';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { Layers, ArrowRight } from 'lucide-react';

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
    <div>
      <PageHeader
        title="Create Service Category"
        description="Define a new service offering. Once submitted, the Platform Admin will review the offering, configure the Sarvam AI conversation script, and activate automated outbound calling."
        breadcrumbs={[
          { label: 'Services', href: '/workspace/services' },
          { label: 'Create Service' },
        ]}
      />

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {error}
            </div>
          )}

          <Input
            label="Service Name"
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Residential Plots / 3BHK Luxury Flats"
          />

          <Input
            label="Service Category"
            required
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="e.g. Land Development / High-Rise Residential"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full text-sm p-3 rounded-md border border-slate-300 focus:outline-none focus:border-brand-500"
              placeholder="Describe the service in detail for the AI calling prompt..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Location"
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g. Wagholi, Pune"
            />
            <Input
              label="Pricing Details"
              value={form.pricingInfo}
              onChange={(e) => handleChange('pricingInfo', e.target.value)}
              placeholder="e.g. Starting from ₹35 Lakhs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Enquiry / Qualification Notes
            </label>
            <textarea
              rows={2}
              value={form.additionalInfo}
              onChange={(e) => handleChange('additionalInfo', e.target.value)}
              className="w-full text-sm p-3 rounded-md border border-slate-300 focus:outline-none focus:border-brand-500"
              placeholder="Key specifications, RERA IDs, or loan approval banks..."
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Submit for Admin Review
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/workspace/services')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
