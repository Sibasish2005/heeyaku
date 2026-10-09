'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Loader2, Save } from 'lucide-react';
import { updateTeamAction, fetchActiveTeamLeadsAction } from '@/app/admin/employees/actions';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';
import { toast } from 'sonner';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    id: string;
    name: string;
    description: string | null;
    colorTag: string | null;
    teamLeadId: string | null;
  };
  onUpdated: () => void;
}

const COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Purple Violet', hex: '#7C3AED' },
  { name: 'Rose Red', hex: '#E11D48' },
  { name: 'Cyan Aqua', hex: '#0891B2' },
];

export default function EditTeamModal({
  isOpen,
  onClose,
  team,
  onUpdated,
}: EditTeamModalProps) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [colorTag, setColorTag] = useState(team.colorTag || '#2563EB');
  const [teamLeadId, setTeamLeadId] = useState(team.teamLeadId || '');
  const [candidates, setCandidates] = useState<Array<{ id: string; name: string; employeeCode: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(team.name);
    setDescription(team.description || '');
    setColorTag(team.colorTag || '#2563EB');
    setTeamLeadId(team.teamLeadId || '');
  }, [team]);

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
      const res = await updateTeamAction({
        id: team.id,
        name: name.trim(),
        description: description.trim() || undefined,
        colorTag,
        teamLeadId: teamLeadId || null,
      });

      if (!res.success) {
        setError(res.error || 'Failed to update squad.');
        return;
      }

      toast.success('Squad info updated successfully!');
      onUpdated();
      onClose();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const tlOptions = [
    { value: '', label: 'Unassigned (No Team Lead)', text: 'Unassigned' },
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
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: colorTag }}
            />
            <h2 className="font-black text-lg text-foreground tracking-tight">
              Edit Squad Info
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          {/* Squad Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Squad Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Titans Squad, Alpha Closers"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Description / Mandate
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary territory, domain focus, or revenue targets..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Color Accent Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Squad Color Accent
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setColorTag(p.hex)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    colorTag === p.hex
                      ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                />
              ))}
              <input
                type="color"
                value={colorTag}
                onChange={(e) => setColorTag(e.target.value)}
                className="w-7 h-7 rounded-full border border-border cursor-pointer bg-transparent"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Team Lead Assignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Assigned Team Lead</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Reports directly to CEO
              </span>
            </label>
            <ShadcnDropdownSelect
              options={tlOptions}
              value={teamLeadId}
              onValueChange={(val: string) => setTeamLeadId(val)}
              placeholder="Select Team Lead"
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-input bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
