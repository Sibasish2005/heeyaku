'use client';

import React, { useState } from 'react';
import { UserPlus, X, Loader2 } from 'lucide-react';
import { createEmployeeAction } from '@/app/admin/employees/actions';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';
import CreateEmployeeCredentialsCard from './dialogs/CreateEmployeeCredentialsCard';
import CreateEmployeeFormFields, { EmployeeFormData } from './dialogs/CreateEmployeeFormFields';

interface CreateEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateEmployeeDialog({
  isOpen,
  onClose,
  onCreated,
}: CreateEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    team: 'Business Development Associates',
    notes: '',
  });

  const [createdCredentials, setCreatedCredentials] = useState<{
    employeeCode: string;
    name: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

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
      const res = await createEmployeeAction(formData);
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to create employee.');
        return;
      }

      setCreatedCredentials({
        employeeCode: res.data.employeeCode,
        name: res.data.name,
        email: res.data.email,
        temporaryPassword: res.data.tempPassword,
      });
      if (onCreated) onCreated();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    const text = `Staff Account Credentials\nName: ${createdCredentials.name}\nEmployee Code: ${createdCredentials.employeeCode}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.temporaryPassword}\nLogin URL: ${window.location.origin}/admin/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFinish = () => {
    setCreatedCredentials(null);
    setFormData({ name: '', email: '', phoneNumber: '', team: 'Business Development Associates', notes: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {createdCredentials ? 'Employee Credentials Generated' : 'Create New Employee'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {createdCredentials ? 'Share these credentials securely with staff' : 'Add staff account to manage and assign leads'}
              </p>
            </div>
          </div>
          <button
            onClick={createdCredentials ? handleFinish : onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdCredentials ? (
          <CreateEmployeeCredentialsCard
            credentials={createdCredentials}
            copied={copied}
            onCopy={handleCopy}
            onFinish={handleFinish}
          />
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive">
                {error}
              </div>
            )}

            <CreateEmployeeFormFields formData={formData} onChange={setFormData} />

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
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Create Staff Account</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
