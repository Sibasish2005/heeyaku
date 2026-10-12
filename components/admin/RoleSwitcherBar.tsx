'use client';

import React, { useState, useTransition } from 'react';
import { Role } from '@prisma/client';
import { switchSimulatedRoleAction } from '@/app/admin/role-switcher-action';
import { Shield, UserCheck, Users, Smartphone, Loader2, SlidersHorizontal } from 'lucide-react';
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
    { id: 'CEO', label: 'CEO View', icon: Shield },
    { id: 'HR', label: 'HR View', icon: UserCheck },
    { id: 'TEAM_LEAD', label: 'Team Lead', icon: Users },
    { id: 'BDA', label: 'BDA View', icon: Smartphone },
  ];

  return (
    <div className="w-full bg-zinc-950 text-white border-b border-zinc-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-40">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700">
          <SlidersHorizontal className="w-3 h-3" />
        </div>
        <span className="font-semibold tracking-tight text-zinc-200">
          Role Simulation Preview:
        </span>
        <span className="text-zinc-400 hidden sm:inline text-[11px]">
          Simulate viewport and permission scope for each role
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer border ${
                isCurrent
                  ? 'bg-white text-zinc-950 border-white font-semibold shadow-xs'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850'
              } disabled:opacity-50`}
            >
              <Icon className="w-3 h-3" />
              <span>{r.label}</span>
              {isPending && isCurrent && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
