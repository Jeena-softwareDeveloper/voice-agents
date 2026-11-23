'use client';

import React, { useState } from 'react';
import { Service } from '@/types';
import { Modal } from '@/components/common/modals/Modal';
import { Button } from '@/components/common/buttons/Button';
import { leadsApi } from '@/features/lead-management/api/leads.api';
import { useToast } from '@/components/common/feedback/Toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onImportComplete: () => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  services,
  onImportComplete,
}) => {
  const { success, error } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewSummary, setPreviewSummary] = useState<any>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const s1 = services[0]?.name || 'Standard Service';
    const s2 = services[1]?.name || s1;
    const csvContent =
      'Lead Name,Phone,Email,Location,Service Category\n' +
      `Rohan Sharma,+919822100001,rohan@example.com,Mumbai,${s1}\n` +
      `Ananya Sen,+919822100002,ananya@example.com,Bangalore,${s2}\n` +
      `Vikram Seth,+919822100003,vikram@example.com,Delhi,${s1}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'crm_leads_import_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = async () => {
    if (!file) {
      error('File Required', 'Please select an Excel (.xlsx) or CSV file.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (selectedServiceId) {
      formData.append('serviceId', selectedServiceId);
    }

    try {
      const res = await leadsApi.importLeads(formData);
      setPreviewSummary(res);
      setStep(3);
      success('Import Successful', `Processed ${res.validRows} new valid leads.`);
      onImportComplete();
    } catch (err: any) {
      error('Import Validation Failed', handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setSelectedServiceId('');
    setPreviewSummary(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Leads Wizard"
      description="Multi-step import with column auto-mapping, service category matching, and duplicate contact validation."
      maxWidth="xl"
    >
      {/* Wizard Progress Indicator */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-xs select-none">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? 'font-bold text-blue-600' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-micro ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            1
          </span>
          Upload File
        </div>
        <div className="h-0.5 w-8 sm:w-12 bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? 'font-bold text-blue-600' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-micro ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            2
          </span>
          Service Mapping
        </div>
        <div className="h-0.5 w-8 sm:w-12 bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? 'font-bold text-blue-600' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-micro ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            3
          </span>
          Summary
        </div>
      </div>

      {/* Step 1: File Upload with Explanations */}
      {step === 1 && (
        <div className="space-y-3.5 text-xs">
          {/* Beginner Guide Cards */}
          <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200/80 space-y-2">
            <div>
              <span className="font-bold text-blue-900 block text-caption uppercase tracking-wider">
                What is this feature?
              </span>
              <p className="text-blue-950 mt-0.5 leading-relaxed text-xs">
                Upload an Excel (.xlsx) or CSV file containing customer enquiries to bulk-populate your CRM.
              </p>
            </div>

            <div className="pt-1.5 border-t border-blue-200/60">
              <span className="font-bold text-blue-900 block text-caption uppercase tracking-wider">
                How does it work?
              </span>
              <p className="text-blue-950 mt-0.5 leading-relaxed text-caption">
                1. Select file → 2. Map columns → 3. Associate leads with services → 4. Validate records → 5. Confirm import.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Select spreadsheet file</span>
            <button
              onClick={handleDownloadSample}
              className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 underline"
            >
              <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 sm:p-8 text-center bg-slate-50/50 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="wizard-file"
            />
            <label htmlFor="wizard-file" className="cursor-pointer">
              <FileSpreadsheet className="w-9 h-9 text-blue-600 mx-auto mb-2" />
              <span className="block text-xs font-bold text-slate-900">
                {file ? file.name : 'Click to select spreadsheet (.xlsx, .csv)'}
              </span>
              <span className="block text-caption text-slate-400 mt-1">
                Expected columns: Lead Name, Phone, Email, Location, Service Category
              </span>
            </label>
          </div>

          {/* Important Rule Banner */}
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-caption leading-relaxed">
              <strong>Important:</strong> Only valid, service-mapped and call-eligible records can enter the automated AI calling queue.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!file}
              onClick={() => setStep(2)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Continue to Mapping
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Service Association & Duplicate Policy */}
      {step === 2 && (
        <div className="space-y-3.5 text-xs">
          <div className="p-3 bg-blue-50/60 rounded-md border border-blue-200/80 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-caption text-blue-800 leading-relaxed">
              Every lead enquiry must belong to a specific service category so the corresponding AI voice agent model can contact and qualify them.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Target Service
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:border-blue-500 text-slate-900"
            >
              <option value="">Auto-detect from 'Service Category' column in spreadsheet</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  Assign all rows to: {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-800 block text-xs">Pre-Import Safety Checks</span>
            <ul className="list-disc pl-4 space-y-1 text-caption text-slate-600">
              <li>Duplicate detection: Contacts already enquiring about this service won't be duplicated.</li>
              <li>Phone number sanity: Removes special characters and validates 10-digit formats.</li>
              <li>Consent requirement: Confirms calling eligibility.</li>
            </ul>
          </div>

          <div className="pt-3 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back
            </Button>
            <Button size="sm" isLoading={isLoading} onClick={handleProcessImport}>
              Validate & Import Leads
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result Summary */}
      {step === 3 && previewSummary && (
        <div className="space-y-4 text-center py-2 text-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Import Batch Finished</h3>

          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <div>
              <span className="block text-lg font-bold text-slate-900">{previewSummary.totalRows}</span>
              <span className="text-micro text-slate-500 uppercase font-semibold">Total Rows</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-emerald-700">{previewSummary.validRows}</span>
              <span className="text-micro text-emerald-600 uppercase font-semibold">Leads Created</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-amber-700">{previewSummary.invalidRows}</span>
              <span className="text-micro text-amber-600 uppercase font-semibold">Duplicates / Skipped</span>
            </div>
          </div>

          <div className="pt-3 flex justify-center">
            <Button size="sm" onClick={handleClose}>
              Done & View Records
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
