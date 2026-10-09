'use client';

import React, { useState, useTransition } from 'react';
import { Role } from '@prisma/client';
import { switchSimulatedRoleAction } from '@/app/admin/role-switcher-action';
import { Crown, UserCheck, Users, Smartphone, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RoleSwitcherBarProps {
  currentRole: Role;
  isRealCeo: boolean;
  simulatedRole?: Role | null;
}

export default function RoleSwitcherBar({
  currentRole,
  isRealCeo,
  simulatedRole,
}: RoleSwitcherBarProps) {
  const [isPending, startTransition] = useTransition();
  const [activeRole, setActiveRole] = useState<string>(simulatedRole || currentRole);
  const router = useRouter();

  if (!isRealCeo) return null;

  const handleSelectRole = (role: string) => {
    setActiveRole(role);
    startTransition(async () => {
      await switchSimulatedRoleAction(role === 'CEO' ? null : role);
      router.refresh();
    });
  };

  const ROLES = [
    { id: 'CEO', label: 'CEO (Omni)', icon: Crown, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { id: 'HR', label: 'HR (People)', icon: UserCheck, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
    { id: 'TEAM_LEAD', label: 'Team Lead', icon: Users, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { id: 'BDA', label: 'BDA (Mobile)', icon: Smartphone, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  ];

  return (
    <div className="w-full bg-slate-900 text-white border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md z-40">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <Sparkles className="w-3 h-3" />
        </div>
        <span className="font-bold tracking-tight text-slate-200">
          Executive Role Simulator:
        </span>
        <span className="text-slate-400 hidden sm:inline text-[11px]">
          Test exactly what each role sees without switching accounts
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const isCurrent = (activeRole === r.id) || (!simulatedRole && r.id === 'CEO' && activeRole === 'CEO');
          return (
            <button
              key={r.id}
              disabled={isPending}
              onClick={() => handleSelectRole(r.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                isCurrent
                  ? `${r.color} font-bold shadow-xs scale-102`
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-800'
              } disabled:opacity-50`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
              {isPending && isCurrent && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
