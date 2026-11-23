'use client';

import React, { useState } from 'react';
import { Service } from '@/types';
import { Modal } from '@/components/common/modals/Modal';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { leadsApi, CreateLeadPayload } from '@/features/lead-management/api/leads.api';
import { useToast } from '@/components/common/feedback/Toast';
import { handleApiError } from '@/lib/api/error-handler';
import { User, Phone, CheckCircle2, ShieldCheck, Layers, Info } from 'lucide-react';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onLeadCreated: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  services,
  onLeadCreated,
}) => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<CreateLeadPayload>({
    name: '',
    phone: '',
    email: '',
    location: '',
    serviceId: services[0]?.id || '',
    leadSource: 'Direct Enquiry',
    notes: '',
    callingConsent: true,
  });

  const handleChange = (field: keyof CreateLeadPayload, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      error('Validation Error', 'Lead name and contact phone number are required.');
      return;
    }
    if (!form.serviceId && services.length > 0) {
      form.serviceId = services[0].id;
    }

    setIsLoading(true);
    try {
      await leadsApi.createLead(form);
      success('Lead Created', `Added ${form.name} under associated service.`);
      onLeadCreated();
      onClose();
      // Reset form
      setForm({
        name: '',
        phone: '',
        email: '',
        location: '',
        serviceId: services[0]?.id || '',
        leadSource: 'Direct Enquiry',
        notes: '',
        callingConsent: true,
      });
    } catch (err: any) {
      error('Failed to Create Lead', handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Lead"
      description="Create a verified prospective customer enquiry associated with a specific service offering."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <Input
              label="Prospect Full Name"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Arun Kumar"
            />
            <p className="text-caption text-slate-500 mt-1">
              Enter the customer or contact's preferred name.
            </p>
          </div>

          <div>
            <Input
              label="Phone Number (with Country Code)"
              required
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+91 98765 43210"
            />
            <p className="text-caption text-slate-500 mt-1">
              Enter a valid customer contact number with the appropriate country code.
            </p>
          </div>

          <div>
            <Input
              label="Email Address (Optional)"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="arun@example.com"
            />
            <p className="text-caption text-slate-500 mt-1">
              Used for WhatsApp / Email brochure and quotation follow-ups.
            </p>
          </div>

          <div>
            <Input
              label="City / Location"
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g. Pune, MH"
            />
            <p className="text-caption text-slate-500 mt-1">
              Helps the AI conversational agent confirm proximity to the offering.
            </p>
          </div>
        </div>

        {/* Associated Service Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Associated Service Category <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={form.serviceId}
            onChange={(e) => handleChange('serviceId', e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:border-blue-500 text-slate-900"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category}) {s.approvalStatus === 'APPROVED' ? '• AI Ready' : '• Pending Approval'}
              </option>
            ))}
          </select>
          <p className="text-caption text-slate-500 mt-1">
            Enter the name of the product or service associated with these enquiries so the correct AI voice prompt is used.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Enquiry Notes / Preferences</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900"
            placeholder="Customer budget range, preferred plot size, or specific timeline..."
          />
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="callingConsent"
              checked={form.callingConsent}
              onChange={(e) => handleChange('callingConsent', e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
            />
            <label htmlFor="callingConsent" className="text-xs text-slate-700 select-none cursor-pointer">
              <span className="font-semibold block text-slate-900">Calling Consent Granted</span>
              <span className="text-caption text-slate-500 block mt-0.5 leading-snug">
                Confirm that the customer is eligible to receive this type of call based on the recorded consent and applicable calling requirements.
              </span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            Create Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
};
