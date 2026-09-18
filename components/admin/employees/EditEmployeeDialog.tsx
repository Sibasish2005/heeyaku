'use client';

import React, { useState, useEffect } from 'react';
import { UserCog, X, AlertCircle, Loader2 } from 'lucide-react';
import { updateEmployeeAction } from '@/app/admin/employees/actions';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';
import EditEmployeeFormFields from './dialogs/EditEmployeeFormFields';

interface EditEmployeeDialogProps {
  isOpen: boolean;
  employee: {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    phoneNumber: string;
    team: string | null;
    notes: string | null;
  } | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function EditEmployeeDialog({
  isOpen,
  employee,
  onClose,
  onUpdated,
}: EditEmployeeDialogProps) {
  if (!isOpen || !employee) return null;

  return (
    <EditEmployeeDialogContent
      key={employee.id}
      employee={employee}
      onClose={onClose}
      onUpdated={onUpdated}
    />
  );
}

function EditEmployeeDialogContent({
  employee,
  onClose,
  onUpdated,
}: {
  employee: NonNullable<EditEmployeeDialogProps['employee']>;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: employee.name,
    email: employee.email,
    phoneNumber: employee.phoneNumber,
    team: employee.team || 'Business Development Associates',
    notes: employee.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await updateEmployeeAction({ id: employee.id, ...formData });
      if (!res.success) {
        setError(res.error || 'Failed to update employee details');
        return;
      }
      if (onUpdated) onUpdated();
      onClose();
    } catch {
      setError('An unexpected server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Edit Employee Details</h2>
              <p className="text-[11px] text-muted-foreground">{employee.employeeCode}</p>
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

          <EditEmployeeFormFields
            formData={formData}
            onChange={setFormData}
          />

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
