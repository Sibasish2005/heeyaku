'use client';

import React from 'react';
import CreateLeadDialog from '../CreateLeadDialog';
import EditLeadDialog from '../EditLeadDialog';
import BulkAssignDialog from '../BulkAssignDialog';
import ImportLeadsDialog from '../ImportLeadsDialog';
import GoogleSheetSyncDialog from '../GoogleSheetSyncDialog';
import { ActiveEmployee, LeadListItem } from './types';

interface LeadTableModalsProps {
  isCreateOpen: boolean;
  editingLead: LeadListItem | null;
  isBulkAssignOpen: boolean;
  isImportOpen: boolean;
  isSheetsSyncOpen: boolean;
  selectedIds: string[];
  activeEmployees: ActiveEmployee[];
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseBulkAssign: () => void;
  onCloseImport: () => void;
  onCloseSheetsSync: () => void;
  onAssigned: (count: number, employeeName?: string) => void;
}

export default function LeadTableModals({
  isCreateOpen,
  editingLead,
  isBulkAssignOpen,
  isImportOpen,
  isSheetsSyncOpen,
  selectedIds,
  activeEmployees,
  onCloseCreate,
  onCloseEdit,
  onCloseBulkAssign,
  onCloseImport,
  onCloseSheetsSync,
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

      <ImportLeadsDialog
        isOpen={isImportOpen}
        activeEmployees={activeEmployees}
        onClose={onCloseImport}
        onImportSuccess={() => window.location.reload()}
      />

      <GoogleSheetSyncDialog
        isOpen={isSheetsSyncOpen}
        onClose={onCloseSheetsSync}
      />
    </>
  );
}
