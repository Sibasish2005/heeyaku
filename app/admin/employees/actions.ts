'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { generateRandomPassword, hashPassword } from '@/lib/crypto/passwords';
import { generateNextEmployeeCode } from '@/lib/employee/code';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { clearEmployeeChunkCache } from './fetch-actions';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';

const CreateEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: zodPhoneNumberSchema,
  team: z.string().optional().default('Business Development Associates'),
  notes: z.string().optional(),
});

const UpdateEmployeeSchema = z.object({
  id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: zodPhoneNumberSchema,
  team: z.string().optional().default('Business Development Associates'),
  notes: z.string().optional(),
});

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Creates a new employee with an auto-generated EMP-xxxx code and a cryptographically
 * random temporary password. The password hash is stored, and the temporary plaintext
 * password is returned ONLY ONCE in the response for the admin to copy.
 */
export async function createEmployeeAction(input: unknown): Promise<ActionResponse<{
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  tempPassword: string;
}>> {
  try {
    await assertAdminAccess();

    const validated = CreateEmployeeSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { name, email, phoneNumber, team, notes } = validated.data;

    // Check email uniqueness
    const existing = await prisma.employee.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return {
        success: false,
        error: 'An employee with this email address already exists.',
      };
    }

    const employeeCode = await generateNextEmployeeCode();
    const tempPassword = generateRandomPassword(10);
    const passwordHash = await hashPassword(tempPassword);

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        team: team?.trim() || 'BDA',
        notes: notes?.trim() || null,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
      },
    });

    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      data: {
        ...employee,
        tempPassword,
      },
    };
  } catch (error) {
    console.error('Error creating employee:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create employee.',
    };
  }
}

/**
 * Updates basic details for an existing employee.
 */
export async function updateEmployeeAction(input: unknown): Promise<ActionResponse> {
  try {
    await assertAdminAccess();

    const validated = UpdateEmployeeSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { id, name, email, phoneNumber, team, notes } = validated.data;

    // Check if another employee is already using this email
    const existing = await prisma.employee.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        NOT: { id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'Another employee is already registered with this email address.',
      };
    }

    await prisma.employee.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        team: team?.trim() || 'BDA',
        notes: notes?.trim() || null,
      },
    });

    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/employees/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating employee:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee.',
    };
  }
}

/**
 * Toggles an employee's active status (deactivates or reactivates).
 */
export async function toggleEmployeeStatusAction(id: string): Promise<ActionResponse<{ isActive: boolean }>> {
  try {
    await assertAdminAccess();

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!employee) {
      return { success: false, error: 'Employee not found.' };
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { isActive: !employee.isActive },
      select: { isActive: true },
    });

    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/employees/${id}`);

    return { success: true, data: { isActive: updated.isActive } };
  } catch (error) {
    console.error('Error toggling employee status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee status.',
    };
  }
}

/**
 * Resets an employee's password to a newly generated temporary password.
 * Returns the plaintext temporary password once for the admin to copy.
 */
export async function resetEmployeePasswordAction(id: string): Promise<ActionResponse<{ tempPassword: string; employeeCode: string }>> {
  try {
    await assertAdminAccess();

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, employeeCode: true },
    });

    if (!employee) {
      return { success: false, error: 'Employee not found.' };
    }

    const tempPassword = generateRandomPassword(10);
    const passwordHash = await hashPassword(tempPassword);

    await prisma.employee.update({
      where: { id },
      data: { passwordHash },
    });

    return {
      success: true,
      data: {
        tempPassword,
        employeeCode: employee.employeeCode,
      },
    };
  } catch (error) {
    console.error('Error resetting employee password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password.',
    };
  }
}
