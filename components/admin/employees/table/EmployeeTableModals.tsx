'use client';

import React from 'react';
import CreateEmployeeDialog from '../CreateEmployeeDialog';
import EditEmployeeDialog from '../EditEmployeeDialog';
import ResetPasswordDialog from '../ResetPasswordDialog';
import { EmployeeListItem } from '../EmployeeTable';

interface EmployeeTableModalsProps {
  isCreateOpen: boolean;
  editingEmployee: EmployeeListItem | null;
  resettingEmployee: EmployeeListItem | null;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseReset: () => void;
}

export default function EmployeeTableModals({
  isCreateOpen,
  editingEmployee,
  resettingEmployee,
  onCloseCreate,
  onCloseEdit,
  onCloseReset,
}: EmployeeTableModalsProps) {
  return (
    <>
      <CreateEmployeeDialog
        isOpen={isCreateOpen}
        onClose={onCloseCreate}
        onCreated={() => window.location.reload()}
      />

      <EditEmployeeDialog
        isOpen={!!editingEmployee}
        employee={editingEmployee}
        onClose={onCloseEdit}
        onUpdated={() => window.location.reload()}
      />

      <ResetPasswordDialog
        isOpen={!!resettingEmployee}
        employee={resettingEmployee}
        onClose={onCloseReset}
      />
    </>
  );
}
