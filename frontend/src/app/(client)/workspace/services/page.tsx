'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { servicesApi, UpdateServicePayload } from '@/features/services/api/services.api';
import { Service } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, DataTableColumn } from '@/components/common/tables/DataTable';
import { StatusBadge } from '@/components/common/badges/StatusBadge';
import { Button } from '@/components/common/buttons/Button';
import { Modal } from '@/components/common/modals/Modal';
import { Input } from '@/components/common/inputs/Input';
import { useToast } from '@/components/common/feedback/Toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  Plus,
  Eye,
  Edit3,
  Trash2,
  Power,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function ClientServicesListPage() {
  const { success, error: toastError } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Action Pending State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
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
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    setIsLoading(true);
    servicesApi
      .getTenantServices()
      .then(setServices)
      .catch((err) => {
        console.error(err);
        toastError('Failed to load services', handleApiError(err));
      })
      .finally(() => setIsLoading(false));
  };

  // Toggle Active / Inactive
  const handleToggleActive = async (service: Service) => {
    const nextState = !service.isActive;
    setActionLoadingId(service.id);

    try {
      await servicesApi.toggleServiceStatus(service.id, nextState);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: nextState } : s)),
      );
      success(
        nextState ? 'Service Activated' : 'Service Deactivated',
        `'${service.name}' is now ${nextState ? 'active and available for AI calling' : 'inactive'}.`,
      );
    } catch (err: any) {
      toastError('Update Failed', handleApiError(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (service: Service) => {
    setEditingService(service);
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

  // Save Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    setIsSavingEdit(true);
    try {
      const updated = await servicesApi.updateService(editingService.id, editForm);
      setServices((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setIsEditModalOpen(false);
      setEditingService(null);
      success('Service Updated', `'${updated.name}' has been updated successfully.`);
    } catch (err: any) {
      toastError('Save Failed', handleApiError(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (service: Service) => {
    setDeletingService(service);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingService) return;

    setIsDeleting(true);
    try {
      await servicesApi.deleteService(deletingService.id);
      setServices((prev) => prev.filter((s) => s.id !== deletingService.id));
      setIsDeleteModalOpen(false);
      setDeletingService(null);
      success('Service Deleted', `'${deletingService.name}' has been removed successfully.`);
    } catch (err: any) {
      toastError('Delete Failed', handleApiError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Service>[] = [
    {
      id: 'name',
      header: 'Service Category',
      sortable: true,
      cell: (s) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-xs block truncate max-w-[220px]" title={s.name}>
              {s.name}
            </span>
          </div>
          <span className="text-caption text-slate-400 block truncate max-w-[200px]">{s.category}</span>
        </div>
      ),
    },
    {
      id: 'location',
      header: 'Location / Market',
      cell: (s) => <span className="text-xs text-slate-700">{s.location || 'Global Remote / Pan-India'}</span>,
    },
    {
      id: 'pricing',
      header: 'Pricing Information',
      cell: (s) => <span className="text-xs font-semibold text-slate-800">{s.pricingInfo || 'Custom'}</span>,
    },
    {
      id: 'approvalStatus',
      header: 'Admin Approval Status',
      sortable: true,
      accessorKey: 'approvalStatus',
      cell: (s) => <StatusBadge value={s.approvalStatus} category="approval" size="sm" />,
    },
    {
      id: 'aiCallingStatus',
      header: 'AI Calling Readiness',
      cell: (s) => {
        const isApproved = s.approvalStatus === 'APPROVED';
        if (!s.isActive) {
          return <span className="text-xs font-semibold text-slate-400">Disabled (Inactive)</span>;
        }
        return (
          <span className={`text-xs font-semibold ${isApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isApproved ? 'Active (AI Voice Agent Ready)' : 'Locked until approval'}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      cell: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(s);
          }}
          disabled={actionLoadingId === s.id}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold border transition-all ${
            s.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300'
              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:text-slate-700'
          }`}
          title={s.isActive ? 'Click to Deactivate' : 'Click to Activate'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
          />
          {actionLoadingId === s.id ? 'Updating...' : s.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* View Details */}
          <Link
            href={`/workspace/services/${s.id}`}
            className="w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/60 transition-colors shadow-2xs"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>

          {/* Edit Service */}
          <button
            type="button"
            onClick={() => openEditModal(s)}
            className="w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/60 transition-colors shadow-2xs"
            title="Edit Service"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
          </button>

          {/* Toggle Active / Inactive */}
          <button
            type="button"
            onClick={() => handleToggleActive(s)}
            disabled={actionLoadingId === s.id}
            className={`w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-md border transition-colors shadow-2xs disabled:opacity-50 ${
              s.isActive
                ? 'border-amber-200 bg-amber-50/60 text-amber-700 hover:bg-amber-100 hover:border-amber-300'
                : 'border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
            }`}
            title={s.isActive ? 'Deactivate Service' : 'Activate Service'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {/* Delete Service */}
          <button
            type="button"
            onClick={() => openDeleteModal(s)}
            className="w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50/60 transition-colors shadow-2xs"
            title="Delete Service"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const renderMobileServiceCard = (s: Service) => {
    const isApproved = s.approvalStatus === 'APPROVED';
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-3 shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">{s.name}</h4>
            <span className="text-micro text-slate-400 block">{s.category}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleToggleActive(s)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-micro font-bold border transition-colors ${
                s.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {s.isActive ? 'Active' : 'Inactive'}
            </button>
            <StatusBadge value={s.approvalStatus} category="approval" size="sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 bg-slate-50/50 px-2 rounded">
          <div>
            <span className="text-micro uppercase font-semibold text-slate-400 block">Pricing</span>
            <span className="font-semibold text-slate-800 text-caption block truncate">
              {s.pricingInfo || 'Custom'}
            </span>
          </div>
          <div>
            <span className="text-micro uppercase font-semibold text-slate-400 block">Location</span>
            <span className="text-caption text-slate-700 block truncate">
              {s.location || 'Global / Pan-India'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Link
            href={`/workspace/services/${s.id}`}
            className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/60 shadow-2xs"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => openEditModal(s)}
            className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/60 shadow-2xs"
            title="Edit Service"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleActive(s)}
            className={`w-7 h-7 inline-flex items-center justify-center rounded-md border shadow-2xs ${
              s.isActive
                ? 'border-amber-200 bg-amber-50/60 text-amber-700 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={s.isActive ? 'Deactivate Service' : 'Activate Service'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(s)}
            className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50/60 shadow-2xs"
            title="Delete Service"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Services & Products"
        description="Register and manage your offerings. Each service category receives an approved AI voice prompt before calling begins."
        infoTooltip="Each service can have its own AI conversation and associated leads. Platform Admin reviews and approves the AI conversation script before automated calls begin."
        recordCount={services.length}
        recordLabel="services"
        actions={
          <Link href="/workspace/services/create">
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} title="Create a new service offering">
              Add Service
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={services}
        isLoading={isLoading}
        renderMobileCard={renderMobileServiceCard}
        emptyTitle="No service offerings registered"
        emptyDescription="Create your first service so the AI voice agent can be trained with your product knowledge."
        emptyAction={
          <Link href="/workspace/services/create">
            <Button size="sm">Create First Service</Button>
          </Link>
        }
      />

      {/* Edit Service Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSavingEdit) {
            setIsEditModalOpen(false);
            setEditingService(null);
          }
        }}
        title={`Edit Service: ${editingService?.name || ''}`}
        description="Update service details, pricing information, and availability status."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs p-4 sm:p-6">
          <div>
            <Input
              label="Service Name"
              required
              value={editForm.name || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Cloud Infrastructure Audit"
            />
          </div>

          <div>
            <Input
              label="Category / Industry"
              required
              value={editForm.category || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g. Cloud Computing & CyberSecurity"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Location / Market"
                value={editForm.location || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Global Remote & Hybrid"
              />
            </div>
            <div>
              <Input
                label="Pricing Information"
                value={editForm.pricingInfo || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, pricingInfo: e.target.value }))}
                placeholder="e.g. 75,000 INR per audit"
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
              placeholder="Detailed description of the service and customer deliverables..."
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
              placeholder="Any special qualification criteria, warranties, or customer prerequisites..."
            />
          </div>

          {/* Active / Inactive Toggle Switch in Modal */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Service Status</span>
              <span className="text-caption text-slate-500 block">
                {editForm.isActive
                  ? 'Active: Service is enabled for CRM leads and AI calling'
                  : 'Inactive: Service is paused and hidden from active calling dispatches'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingService(null);
              }}
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

      {/* Delete Service Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setDeletingService(null);
          }
        }}
        title="Delete Service Offering"
        maxWidth="md"
      >
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200/80 rounded-lg text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-900">Are you sure you want to delete this service?</p>
              <p className="text-caption text-red-700 mt-1 leading-relaxed">
                This will permanently delete{' '}
                <strong className="font-semibold text-red-950">"{deletingService?.name}"</strong> and its
                associated AI conversation prompt configuration. Leads and past call histories will be safely
                unlinked.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingService(null);
              }}
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
