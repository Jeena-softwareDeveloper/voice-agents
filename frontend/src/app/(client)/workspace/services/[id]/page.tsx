'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { servicesApi, UpdateServicePayload } from '@/features/services/api/services.api';
import { Service } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/common/loaders/Spinner';
import { Button } from '@/components/common/buttons/Button';
import { Modal } from '@/components/common/modals/Modal';
import { Input } from '@/components/common/inputs/Input';
import { useToast } from '@/components/common/feedback/Toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  Power,
  ArrowLeft,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

export default function ClientServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  const { success, error: toastError } = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateServicePayload>({
    name: '',
    category: '',
    description: '',
    location: '',
    pricingInfo: '',
    additionalInfo: '',
    isActive: true,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = () => {
    setIsLoading(true);
    servicesApi
      .getServiceById(serviceId)
      .then(setService)
      .catch((err) => {
        console.error(err);
        toastError('Failed to load service', handleApiError(err));
      })
      .finally(() => setIsLoading(false));
  };

  const handleToggleActive = async () => {
    if (!service) return;
    const nextState = !service.isActive;
    setIsTogglingActive(true);

    try {
      await servicesApi.toggleServiceStatus(service.id, nextState);
      setService((prev) => (prev ? { ...prev, isActive: nextState } : null));
      success(
        nextState ? 'Service Activated' : 'Service Deactivated',
        `'${service.name}' is now ${nextState ? 'active and available for AI calling' : 'inactive'}.`,
      );
    } catch (err: any) {
      toastError('Update Failed', handleApiError(err));
    } finally {
      setIsTogglingActive(false);
    }
  };

  const [isApprovingConfig, setIsApprovingConfig] = useState(false);
  const handleApproveAiConfig = async () => {
    if (!service) return;
    setIsApprovingConfig(true);
    try {
      const updated = await servicesApi.approveServiceAiConfig(service.id);
      setService(updated);
      success('AI Configuration Approved', `'${service.name}' AI calling configuration is now approved and active for outbound calls.`);
    } catch (err: any) {
      toastError('Approval Failed', handleApiError(err));
    } finally {
      setIsApprovingConfig(false);
    }
  };

  const openEditModal = () => {
    if (!service) return;
    setEditForm({
      name: service.name,
      category: service.category,
      description: service.description || '',
      location: service.location || '',
      pricingInfo: service.pricingInfo || '',
      additionalInfo: (service as any).additionalInfo || '',
      isActive: service.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setIsSavingEdit(true);
    try {
      const updated = await servicesApi.updateService(service.id, editForm);
      setService((prev) => (prev ? { ...prev, ...updated } : null));
      setIsEditModalOpen(false);
      success('Service Updated', `'${updated.name}' has been updated successfully.`);
    } catch (err: any) {
      toastError('Save Failed', handleApiError(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!service) return;

    setIsDeleting(true);
    try {
      await servicesApi.deleteService(service.id);
      success('Service Deleted', `'${service.name}' has been removed successfully.`);
      router.push('/workspace/services');
    } catch (err: any) {
      toastError('Delete Failed', handleApiError(err));
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading service details..." className="py-20" />;
  }

  if (!service) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Service offering not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/workspace/services')}>
          Back to Services
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={service.name}
        description={`Category: ${service.category} • Created: ${new Date((service as any).createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Services', href: '/workspace/services' },
          { label: service.name },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleActive}
              disabled={isTogglingActive}
              leftIcon={<Power className={`w-3.5 h-3.5 ${service.isActive ? 'text-amber-500' : 'text-emerald-600'}`} />}
            >
              {service.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openEditModal}
              leftIcon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-red-50 text-red-600 border-slate-200"
              onClick={() => setIsDeleteModalOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
            >
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/workspace/services')} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service Details */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> Service Specifications
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold border ${
                service.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${service.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {service.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <dl className="space-y-3 text-xs">
            <div>
              <dt className="text-slate-400 font-medium text-caption uppercase">Service Name</dt>
              <dd className="font-semibold text-slate-900 text-sm mt-0.5">{service.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium text-caption uppercase">Category / Industry</dt>
              <dd className="font-semibold text-slate-800 mt-0.5">{service.category}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium text-caption uppercase">Description</dt>
              <dd className="font-normal text-slate-700 mt-0.5 leading-relaxed">{service.description}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium text-caption uppercase">Location / Market</dt>
              <dd className="font-semibold text-slate-800 mt-0.5">{service.location || 'Global Remote / Pan-India'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium text-caption uppercase">Pricing Details</dt>
              <dd className="font-semibold text-slate-800 mt-0.5">{service.pricingInfo || 'Custom / Contact for Quote'}</dd>
            </div>
            {(service as any).additionalInfo && (
              <div>
                <dt className="text-slate-400 font-medium text-caption uppercase">Additional Guidelines</dt>
                <dd className="font-normal text-slate-700 mt-0.5 leading-relaxed">{(service as any).additionalInfo}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* AI Calling Approval Status */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" /> AI Calling Configuration
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-caption font-bold ${
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
              {service.approvalStatus === 'APPROVED' ? 'Approved' : 'Pending Approval'}
            </span>
          </div>

          {service.serviceAiConfig ? (
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className={`ml-2 font-bold px-2 py-0.5 rounded-full text-[10px] ${service.serviceAiConfig.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {service.serviceAiConfig.status || 'DRAFT'}
                  </span>
                </div>
                {service.serviceAiConfig.status !== 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={handleApproveAiConfig}
                    isLoading={isApprovingConfig}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  >
                    Approve Configuration
                  </Button>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-medium">Opening Script Preview:</span>
                <p className="mt-1 text-slate-700 font-mono text-caption bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                  {service.serviceAiConfig.openingIntro}
                </p>
              </div>
              {service.serviceAiConfig.qualificationQuestions && Array.isArray(service.serviceAiConfig.qualificationQuestions) && service.serviceAiConfig.qualificationQuestions.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium">Qualification Questions:</span>
                  <ul className="mt-1 list-disc list-inside text-caption text-slate-700 space-y-1 bg-white p-2.5 rounded border border-slate-200">
                    {service.serviceAiConfig.qualificationQuestions.map((q: any, i: number) => (
                      <li key={i}>{typeof q === 'string' ? q : q.question || JSON.stringify(q)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700">AI Calling Configuration Draft</p>
              <p className="leading-relaxed">
                Initial configuration is being finalized. You can approve or modify instructions via the AI Calling page.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Workflow Stages Section */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Configured Follow-up Workflow Stages ({service.followUpStages?.length || 0})
            </h3>
          </div>
          <span className="text-caption text-slate-400 font-medium">Sequential Customer Progression</span>
        </div>

        {service.followUpStages && service.followUpStages.length > 0 ? (
          <div className="space-y-3">
            {service.followUpStages.map((stage: any, idx: number) => (
              <div
                key={stage.id || idx}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {stage.order}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{stage.name}</span>
                    <span className="text-caption text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      Trigger: {stage.triggerTiming}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {stage.callbackScheduling && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Callback
                      </span>
                    )}
                    {stage.meetingScheduling && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Site Visit / Meeting
                      </span>
                    )}
                    <span className="text-caption text-slate-400">Max {stage.retryLimit || 3} Retries</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-caption pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium block">Next Action:</span>
                    <span className="text-slate-800 font-semibold">{stage.nextAction}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Stop Condition:</span>
                    <span className="text-slate-600">{stage.stopConditions || 'Customer Opt-Out'}</span>
                  </div>
                </div>

                {stage.questions && Array.isArray(stage.questions) && stage.questions.length > 0 && (
                  <div className="pt-1">
                    <span className="text-slate-400 text-caption font-medium block mb-1">Stage Questions:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5 pl-1">
                      {stage.questions.map((q: any, qIdx: number) => (
                        <li key={qIdx}>{typeof q === 'string' ? q : q.question || JSON.stringify(q)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No follow-up workflow stages configured for this service offering.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSavingEdit) setIsEditModalOpen(false);
        }}
        title={`Edit Service: ${service.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs p-4 sm:p-6">
          <div>
            <Input
              label="Service Name"
              required
              value={editForm.name || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Input
              label="Category / Industry"
              required
              value={editForm.category || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Location / Market"
                value={editForm.location || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div>
              <Input
                label="Pricing Information"
                value={editForm.pricingInfo || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, pricingInfo: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={editForm.description || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Notes / Guidelines
            </label>
            <textarea
              rows={2}
              value={editForm.additionalInfo || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, additionalInfo: e.target.value }))}
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed text-slate-900"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Service Status</span>
              <span className="text-caption text-slate-500 block">
                {editForm.isActive ? 'Active for leads and calling' : 'Inactive / Paused'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                editForm.isActive ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  editForm.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSavingEdit}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSavingEdit}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteModalOpen(false);
        }}
        title="Delete Service Offering"
        maxWidth="md"
      >
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200/80 rounded-lg text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-900">Permanently delete "{service.name}"?</p>
              <p className="text-caption text-red-700 mt-1 leading-relaxed">
                This action will delete the service and all associated AI prompts. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Service
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
