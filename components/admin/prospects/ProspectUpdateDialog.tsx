'use client';

import React, { useState } from 'react';
import { LeadStatus } from '@prisma/client';
import { X, CheckCircle2, Phone, User, Clock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { ProspectItem, PROSPECT_STATUS_META } from './types';
import { updateProspectStatusAction } from '@/app/admin/prospects/actions';
import { toast } from 'sonner';

interface ProspectUpdateDialogProps {
  prospect: ProspectItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: { id: string; status: LeadStatus; updatedNotes: string | null }) => void;
}

const AVAILABLE_STATUSES: LeadStatus[] = [
  'INTERESTED',
  'CALL_BACK',
  'FOLLOW_UP',
  'CONVERTED',
  'NOT_INTERESTED',
  'NOT_QUALIFIED',
  'OTHER',
];

export default function ProspectUpdateDialog({
  prospect,
  isOpen,
  onClose,
  onSuccess,
}: ProspectUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(
    prospect?.status || 'INTERESTED'
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when prospect changes
  React.useEffect(() => {
    if (prospect) {
      setSelectedStatus(prospect.status);
      setNotes('');
    }
  }, [prospect]);

  if (!isOpen || !prospect) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await updateProspectStatusAction({
        leadId: prospect.id,
        status: selectedStatus,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data) {
        toast.success(
          selectedStatus === 'CONVERTED'
            ? `🎉 Deal Closed! ${prospect.name} marked as CONVERTED.`
            : `Prospect status updated to ${PROSPECT_STATUS_META[selectedStatus]?.label || selectedStatus}.`
        );
        onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.error || 'Failed to update prospect status.');
      }
    } catch {
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMeta = PROSPECT_STATUS_META[selectedStatus] || {
    label: selectedStatus,
    badgeClass: 'bg-muted text-muted-foreground',
    dotClass: 'bg-muted-foreground',
    description: '',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-card border border-border/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                {prospect.leadCode}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Prospect</span>
              </span>
            </div>
            <h2 className="text-lg font-black text-foreground mt-1.5 flex items-center gap-2">
              <span>{prospect.name}</span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <a
                href={`tel:${prospect.phoneNumber}`}
                className="inline-flex items-center gap-1 font-mono text-[#2563EB] dark:text-blue-400 hover:underline font-semibold"
              >
                <Phone className="w-3 h-3" />
                <span>{prospect.phoneNumber}</span>
              </a>
              {prospect.company && (
                <>
                  <span>•</span>
                  <span className="truncate">{prospect.company}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Qualification Attribution Card */}
        {prospect.originalBda && (
          <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground font-medium">Qualified & Handed over by: </span>
                <span className="font-bold text-foreground">{prospect.originalBda.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground ml-1">
                  ({prospect.originalBda.employeeCode})
                </span>
              </div>
            </div>
            {prospect.promotedToProspectAt && (
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(prospect.promotedToProspectAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </span>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Update Disposition Status:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_STATUSES.map((st) => {
                const meta = PROSPECT_STATUS_META[st] || { label: st, badgeClass: '', dotClass: '' };
                const isSelected = selectedStatus === st;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#2563EB]/10 text-foreground ring-1 ring-[#2563EB]'
                        : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} />
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
            {statusMeta.description && (
              <p className="text-[11px] text-muted-foreground mt-2 italic">
                {statusMeta.description}
              </p>
            )}
          </div>

          {/* Remarks / Discussion Notes */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
              Team Lead Closing Remarks / Meeting Notes:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discussed pricing options. Customer agreed to demo call on Thursday 4 PM..."
              className="w-full text-xs p-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all resize-none"
            />
          </div>

          {/* Historical Notes Accordion Preview */}
          {prospect.notes && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 max-h-24 overflow-y-auto text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
              <span className="font-bold text-foreground block mb-1 font-sans text-[10px] uppercase tracking-wider">
                Previous Activity History:
              </span>
              {prospect.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white shadow-md transition-all cursor-pointer ${
                selectedStatus === 'CONVERTED'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-[#2563EB] hover:bg-blue-700 shadow-blue-500/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
