'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientsApi, CreateClientPayload } from '@/features/clients/api/clients.api';
import { handleApiError } from '@/lib/api/error-handler';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { Select } from '@/components/common/dropdowns/Select';
import { Building2, User, PhoneCall, CheckCircle2 } from 'lucide-react';

export default function CreateClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationResult, setInvitationResult] = useState<any>(null);

  const [form, setForm] = useState<CreateClientPayload>({
    companyName: '',
    businessEmail: '',
    contactNumber: '',
    businessType: 'Real Estate',
    country: 'India',
    state: 'Maharashtra',
    city: 'Pune',
    adminName: '',
    adminEmail: '',
    adminMobile: '',
    subscriptionPlan: 'Enterprise AI Calling Pro',
    monthlyCallingLimit: 1000,
    initialCredits: 1500,
  });

  const handleChange = (field: keyof CreateClientPayload, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await clientsApi.create(form);
      setInvitationResult(res);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (invitationResult) {
    return (
      <div>
        <PageHeader title="Client Account Provisioned" />
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Tenant Account Successfully Created</h2>
          <p className="text-xs text-slate-600 mt-2">
            A unique tenant identifier was generated for <strong>{invitationResult.companyName}</strong> and an activation invitation link was generated.
          </p>

          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-left">
            <p className="text-xs font-semibold text-slate-700 mb-1">Invitation Activation Link:</p>
            <div className="p-2.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 break-all select-all">
              {invitationResult.invitationLink}
            </div>
            <p className="text-caption text-slate-400 mt-2">
              The client administrator ({invitationResult.email}) will open this link to set their password and complete business onboarding.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={() => router.push('/admin/clients')}>Back to Client List</Button>
            <Button variant="outline" onClick={() => setInvitationResult(null)}>Create Another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create Client Account"
        description="Provision a new multi-tenant client organization, administrator profile, subscription tier, and calling entitlements."
        breadcrumbs={[
          { label: 'Clients', href: '/admin/clients' },
          { label: 'Create Client' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {/* 1. Company Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" /> 1. Company Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              required
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="e.g. Apex Cloud Solutions / CareWell Clinics"
            />
            <Input
              label="Business Email"
              type="email"
              required
              value={form.businessEmail}
              onChange={(e) => handleChange('businessEmail', e.target.value)}
              placeholder="contact@company.com"
            />
            <Input
              label="Contact Number"
              required
              value={form.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              placeholder="+91 98765 43210"
            />
            <Select
              label="Business Type"
              options={[
                { value: 'SaaS & Enterprise Technology', label: 'SaaS & Enterprise Technology' },
                { value: 'Healthcare & Clinics', label: 'Healthcare & Clinics' },
                { value: 'Financial Services & Loans', label: 'Financial Services & Loans' },
                { value: 'Real Estate & Infrastructure', label: 'Real Estate & Infrastructure' },
                { value: 'Education & Admissions', label: 'Education & Admissions' },
                { value: 'E-commerce & Retail', label: 'E-commerce & Retail' },
                { value: 'Manufacturing & Logistics', label: 'Manufacturing & Logistics' },
                { value: 'Professional Services', label: 'Professional Services' },
              ]}
              value={form.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
            />
            <Input
              label="State / Province"
              required
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="e.g. Maharashtra"
            />
            <Input
              label="City"
              required
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>
        </div>

        {/* 2. Administrator Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" /> 2. Initial Administrator Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Administrator Name"
              required
              value={form.adminName}
              onChange={(e) => handleChange('adminName', e.target.value)}
              placeholder="e.g. Rajesh Mehta"
            />
            <Input
              label="Administrator Email (Login ID)"
              type="email"
              required
              value={form.adminEmail}
              onChange={(e) => handleChange('adminEmail', e.target.value)}
              placeholder="rajesh@company.com"
            />
            <Input
              label="Mobile Number"
              value={form.adminMobile}
              onChange={(e) => handleChange('adminMobile', e.target.value)}
              placeholder="+91 99000 11223"
            />
          </div>
        </div>

        {/* 3. Account & AI Calling Configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-600" /> 3. Account & AI Calling Entitlements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Subscription Plan"
              options={[
                { value: 'Starter AI Calling', label: 'Starter AI Calling (500 Mins)' },
                { value: 'Enterprise AI Calling Pro', label: 'Enterprise AI Calling Pro (2000 Mins)' },
                { value: 'Unlimited Enterprise Fleet', label: 'Unlimited Enterprise Fleet' },
              ]}
              value={form.subscriptionPlan}
              onChange={(e) => handleChange('subscriptionPlan', e.target.value)}
            />
            <Input
              label="Monthly Calling Limit (Minutes)"
              type="number"
              value={String(form.monthlyCallingLimit)}
              onChange={(e) => handleChange('monthlyCallingLimit', Number(e.target.value))}
            />
            <Input
              label="Initial Credit Allocation (₹)"
              type="number"
              value={String(form.initialCredits)}
              onChange={(e) => handleChange('initialCredits', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" isLoading={isLoading}>
            Create Tenant & Send Invitation
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/clients')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
