'use client';

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, PlusCircle, Loader2 } from 'lucide-react';
import { createLeadAction } from '@/app/admin/leads/actions';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';
import CreateLeadFormFields, { CreateLeadFormData } from './dialogs/CreateLeadFormFields';

interface ActiveEmployee {
  id: string;
  employeeCode: string;
  name: string;
  team: string | null;
}

interface CreateLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeEmployees: ActiveEmployee[];
  onLeadCreated?: () => void;
}

export default function CreateLeadDialog({
  isOpen,
  onClose,
  activeEmployees,
  onLeadCreated,
}: CreateLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateLeadFormData>({
    name: '',
    phoneNumber: '',
    email: '',
    company: '',
    source: 'MANUAL',
    assignedEmployeeId: '',
  });

  if (!isOpen) return null;

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
      const res = await createLeadAction({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email || undefined,
        company: formData.company || undefined,
        source: formData.source || 'MANUAL',
        assignedEmployeeId: formData.assignedEmployeeId || undefined,
      });

      if (!res.success) {
        setError(res.error || 'Failed to create lead.');
        return;
      }

      setFormData({
        name: '',
        phoneNumber: '',
        email: '',
        company: '',
        source: 'MANUAL',
        assignedEmployeeId: '',
      });

      if (onLeadCreated) onLeadCreated();
      onClose();
    } catch {
      setError('An unexpected server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Add New Lead</h2>
              <p className="text-[11px] text-muted-foreground">Record an admission inquiry or sales prospect</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <CreateLeadFormFields
            formData={formData}
            activeEmployees={activeEmployees}
            onChange={setFormData}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
              <span>Create Lead</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
