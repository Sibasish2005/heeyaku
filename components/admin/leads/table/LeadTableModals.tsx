'use client';

import React from 'react';
import CreateLeadDialog from '../CreateLeadDialog';
import EditLeadDialog from '../EditLeadDialog';
import BulkAssignDialog from '../BulkAssignDialog';
import ImportLeadsDialog from '../ImportLeadsDialog';
import AutoAssignDialog from '../AutoAssignDialog';
import { ActiveEmployee, ActiveTeam, LeadListItem } from './types';

interface LeadTableModalsProps {
  isCreateOpen: boolean;
  editingLead: LeadListItem | null;
  isBulkAssignOpen: boolean;
  isAutoAssignOpen: boolean;
  isImportOpen: boolean;
  importMode?: 'file' | 'sheets';
  selectedIds: string[];
  activeEmployees: ActiveEmployee[];
  teams?: ActiveTeam[];
  currentUserRole?: string;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseBulkAssign: () => void;
  onCloseAutoAssign: () => void;
  onCloseImport: () => void;
  onAssigned: (count: number, targetName?: string) => void;
}

export default function LeadTableModals({
  isCreateOpen,
  editingLead,
  isBulkAssignOpen,
  isAutoAssignOpen,
  isImportOpen,
  importMode = 'file',
  selectedIds,
  activeEmployees,
  teams = [],
  currentUserRole,
  onCloseCreate,
  onCloseEdit,
  onCloseBulkAssign,
  onCloseAutoAssign,
  onCloseImport,
  onAssigned,
}: LeadTableModalsProps) {
  return (
    <>
      <CreateLeadDialog
        isOpen={isCreateOpen}
        activeEmployees={activeEmployees}
        teams={teams}
        currentUserRole={currentUserRole}
        onClose={onCloseCreate}
        onLeadCreated={() => window.location.reload()}
      />

      <EditLeadDialog
        isOpen={!!editingLead}
        lead={editingLead}
        activeEmployees={activeEmployees}
        teams={teams}
        currentUserRole={currentUserRole}
        onClose={onCloseEdit}
        onLeadUpdated={() => window.location.reload()}
      />

      <BulkAssignDialog
        isOpen={isBulkAssignOpen}
        selectedLeadIds={selectedIds}
        activeEmployees={activeEmployees}
        teams={teams}
        currentUserRole={currentUserRole}
        onClose={onCloseBulkAssign}
        onAssigned={onAssigned}
      />

      <AutoAssignDialog
        isOpen={isAutoAssignOpen}
        activeEmployees={activeEmployees}
        teams={teams}
        currentUserRole={currentUserRole}
        onClose={onCloseAutoAssign}
        onAssigned={(count) => onAssigned(count)}
      />

      <ImportLeadsDialog
        isOpen={isImportOpen}
        activeEmployees={activeEmployees}
        teams={teams}
        currentUserRole={currentUserRole}
        onClose={onCloseImport}
        onImportSuccess={() => window.location.reload()}
        mode={importMode}
      />
    </>
  );
}
