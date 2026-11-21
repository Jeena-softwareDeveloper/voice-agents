'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { leadsApi } from '@/features/lead-management/api/leads.api';
import { servicesApi } from '@/features/services/api/services.api';
import { Service } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/buttons/Button';
import { Select } from '@/components/common/dropdowns/Select';
import { handleApiError } from '@/lib/api/error-handler';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ImportLeadsPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<any>(null);

  useEffect(() => {
    servicesApi.getTenantServices().then(setServices).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an Excel (.xlsx/.xls) or CSV file to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (selectedServiceId) {
      formData.append('serviceId', selectedServiceId);
    }

    try {
      const res = await leadsApi.importLeads(formData);
      setImportSummary(res);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (importSummary) {
    return (
      <div>
        <PageHeader title="Lead Batch Import Completed" />
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Import Batch Processed Successfully</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">File: {importSummary.fileName}</p>

          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-center">
            <div>
              <span className="block text-xl font-bold text-slate-900">{importSummary.totalRows}</span>
              <span className="text-[11px] text-slate-500">Total Rows</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-emerald-600">{importSummary.validRows}</span>
              <span className="text-[11px] text-slate-500">Valid Leads Created</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-amber-600">{importSummary.invalidRows}</span>
              <span className="text-[11px] text-slate-500">Skipped / Duplicates</span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={() => router.push('/workspace/calls')}>View Imported Leads</Button>
            <Button variant="outline" onClick={() => setImportSummary(null)}>Import Another File</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Import Leads (Excel / CSV)"
        description="Upload category-wise leads. Choose a specific service category for single-service files or let the system map rows automatically using the Service Category column."
        breadcrumbs={[
          { label: 'Calls', href: '/workspace/calls' },
          { label: 'Import Leads' },
        ]}
      />

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Service Association Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Service Category
            </label>
            <Select
              options={[
                { value: '', label: 'Auto-detect from file (Multi-Service Import)' },
                ...services.map((s) => ({ value: s.id, label: `${s.name} (${s.category})` })),
              ]}
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Select a service if all rows belong to the same category, or leave blank if your spreadsheet includes a <em>Service Category</em> column.
            </p>
          </div>

          {/* File Drop Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Spreadsheet File</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-brand-500 rounded-xl p-8 text-center bg-slate-50/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileSpreadsheet className="w-10 h-10 text-brand-600 mx-auto mb-2" />
                <span className="block text-xs font-bold text-slate-800">
                  {file ? file.name : 'Click to select Excel (.xlsx) or CSV file'}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1">
                  Expected columns: Lead Name, Phone, Email, Location, Service Category
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Process & Validate Import
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/workspace/calls')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
