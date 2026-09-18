'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { updateLeadAction, deleteLeadAction } from '@/app/admin/leads/actions';
import { LeadStatus } from '@prisma/client';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';
import EditLeadFormFields, { EditLeadFormData } from './dialogs/EditLeadFormFields';

interface ActiveEmployee {
  id: string;
  employeeCode: string;
  name: string;
  team: string | null;
}

export interface LeadDetailItem {
  id: string;
  leadCode: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  company: string | null;
  source: string;
  status: LeadStatus;
  notes: string | null;
  assignedEmployeeId: string | null;
  assignedEmployee?: { id: string; employeeCode: string; name: string } | null;
}

interface EditLeadDialogProps {
  isOpen: boolean;
  lead: LeadDetailItem | null;
  activeEmployees: ActiveEmployee[];
  onClose: () => void;
  onLeadUpdated?: () => void;
}

export default function EditLeadDialog({
  isOpen,
  lead,
  activeEmployees,
  onClose,
  onLeadUpdated,
}: EditLeadDialogProps) {
  if (!isOpen || !lead) return null;

  return (
    <EditLeadDialogContent
      key={lead.id}
      lead={lead}
      activeEmployees={activeEmployees}
      onClose={onClose}
      onLeadUpdated={onLeadUpdated}
    />
  );
}

function EditLeadDialogContent({
  lead,
  activeEmployees,
  onClose,
  onLeadUpdated,
}: {
  lead: NonNullable<EditLeadDialogProps['lead']>;
  activeEmployees: ActiveEmployee[];
  onClose: () => void;
  onLeadUpdated?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EditLeadFormData>({
    name: lead.name,
    phoneNumber: lead.phoneNumber,
    email: lead.email || '',
    company: lead.company || '',
    source: lead.source,
    status: lead.status,
    notes: lead.notes || '',
    assignedEmployeeId: lead.assignedEmployeeId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneValidation = zodPhoneNumberSchema.safeParse(formData.phoneNumber);
    if (!phoneValidation.success) {
      setError(phoneValidation.error.issues[0]?.message || 'Phone number must be a valid 10-digit number.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateLeadAction({
        id: lead.id, name: formData.name, phoneNumber: formData.phoneNumber,
        email: formData.email || undefined, company: formData.company || undefined,
        source: formData.source || 'MANUAL', status: formData.status,
        notes: formData.notes || undefined, assignedEmployeeId: formData.assignedEmployeeId || undefined,
      });
      if (!res.success) {
        setError(res.error || 'Failed to update lead.');
        return;
      }
      if (onLeadUpdated) onLeadUpdated();
      onClose();
    } catch {
      setError('An unexpected server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete lead ${lead.leadCode} (${lead.name})?`)) return;
    setDeleting(true);
    try {
      const res = await deleteLeadAction(lead.id);
      if (!res.success) {
        setError(res.error || 'Failed to delete lead.');
        return;
      }
      if (onLeadUpdated) onLeadUpdated();
      onClose();
    } catch {
      setError('An unexpected server error occurred.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Edit Lead Record</h2>
                <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/50">
                  {lead.leadCode}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Update prospect details and pipeline status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <EditLeadFormFields
            formData={formData}
            activeEmployees={activeEmployees}
            onChange={setFormData}
          />

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Lead</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
