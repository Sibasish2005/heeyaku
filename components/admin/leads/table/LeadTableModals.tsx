'use client';

import React from 'react';
import CreateLeadDialog from '../CreateLeadDialog';
import EditLeadDialog from '../EditLeadDialog';
import BulkAssignDialog from '../BulkAssignDialog';
import ImportLeadsDialog from '../ImportLeadsDialog';
import AutoAssignDialog from '../AutoAssignDialog';
import { ActiveEmployee, LeadListItem } from './types';

interface LeadTableModalsProps {
  isCreateOpen: boolean;
  editingLead: LeadListItem | null;
  isBulkAssignOpen: boolean;
  isAutoAssignOpen: boolean;
  isImportOpen: boolean;
  selectedIds: string[];
  activeEmployees: ActiveEmployee[];
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseBulkAssign: () => void;
  onCloseAutoAssign: () => void;
  onCloseImport: () => void;
  onAssigned: (count: number, employeeName?: string) => void;
}

export default function LeadTableModals({
  isCreateOpen,
  editingLead,
  isBulkAssignOpen,
  isAutoAssignOpen,
  isImportOpen,
  selectedIds,
  activeEmployees,
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
        onClose={onCloseCreate}
        onLeadCreated={() => window.location.reload()}
      />

      <EditLeadDialog
        isOpen={!!editingLead}
        lead={editingLead}
        activeEmployees={activeEmployees}
        onClose={onCloseEdit}
        onLeadUpdated={() => window.location.reload()}
      />

      <BulkAssignDialog
        isOpen={isBulkAssignOpen}
        selectedLeadIds={selectedIds}
        activeEmployees={activeEmployees}
        onClose={onCloseBulkAssign}
        onAssigned={onAssigned}
      />

      <AutoAssignDialog
        isOpen={isAutoAssignOpen}
        activeEmployees={activeEmployees}
        onClose={onCloseAutoAssign}
        onAssigned={(count) => onAssigned(count)}
      />

      <ImportLeadsDialog
        isOpen={isImportOpen}
        activeEmployees={activeEmployees}
        onClose={onCloseImport}
        onImportSuccess={() => window.location.reload()}
      />
    </>
  );
}
