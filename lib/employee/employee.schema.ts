import { z } from 'zod';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';

export const CreateEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: zodPhoneNumberSchema,
  role: z.enum(['BDA', 'TEAM_LEAD', 'HR']).default('BDA'),
  teamId: z.string().optional().nullable(),
  teamLeadId: z.string().optional().nullable(),
  team: z.string().optional().default('Business Development Associates'),
  notes: z.string().optional(),
  password: z
    .string()
    .min(15, 'Password must be at least 15 characters to satisfy Clerk security policies')
    .max(100, 'Password cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export const ResetPasswordSchema = z.object({
  id: z.string().min(1, 'Employee ID is required'),
  password: z
    .string()
    .min(15, 'Password must be at least 15 characters to satisfy Clerk security policies')
    .max(100, 'Password cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const UpdateEmployeeSchema = z.object({
  id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: zodPhoneNumberSchema,
  role: z.enum(['BDA', 'TEAM_LEAD', 'HR']).optional(),
  teamId: z.string().optional().nullable(),
  teamLeadId: z.string().optional().nullable(),
  team: z.string().optional().default('Business Development Associates'),
  notes: z.string().optional(),
});

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
