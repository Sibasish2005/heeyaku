'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Loader2, Sparkles } from 'lucide-react';
import { createTeamAction, fetchActiveTeamLeadsAction } from '@/app/admin/employees/actions';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Purple Violet', hex: '#7C3AED' },
  { name: 'Rose Red', hex: '#E11D48' },
  { name: 'Cyan Aqua', hex: '#0891B2' },
];

export default function CreateTeamModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colorTag, setColorTag] = useState('#2563EB');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [candidates, setCandidates] = useState<Array<{ id: string; name: string; employeeCode: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    async function loadCandidates() {
      try {
        const res = await fetchActiveTeamLeadsAction();
        if (mounted && res.success && res.data) {
          setCandidates(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCandidates();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Squad name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await createTeamAction({
        name: name.trim(),
        description: description.trim() || undefined,
        colorTag,
        teamLeadId: teamLeadId || undefined,
      });

      if (!res.success) {
        setError(res.error || 'Failed to create squad.');
        return;
      }

      onCreated();
      onClose();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const tlOptions = [
    { value: '', label: 'Unassigned (No Team Lead yet)', text: 'Unassigned' },
    ...candidates.map((c) => ({
      value: c.id,
      label: `${c.name} (${c.employeeCode})`,
      text: `${c.name} (${c.employeeCode})`,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: colorTag }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Create New Squad</h2>
              <p className="text-[11px] text-muted-foreground">Form a new sales team and designate a Team Lead</p>
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
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Squad Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Phoenix Titans, Alpha Squad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Designate Team Lead</label>
            <ShadcnDropdownSelect
              value={teamLeadId}
              options={tlOptions}
              onValueChange={setTeamLeadId}
              placeholder="Select Team Lead..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Squad Color Tag</label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.hex}
                  onClick={() => setColorTag(preset.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    colorTag === preset.hex ? 'scale-110 border-foreground shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Squad Description / Focus Area</label>
            <textarea
              rows={2}
              placeholder="e.g. Outbound tier-1 admissions, high-ticket conversions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground resize-none"
            />
          </div>

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
              <span>Create Squad</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
