'use server';

import { prisma } from '@/lib/prisma';
import { assertSuperAdmin, invalidateUserSessionCache } from '@/lib/auth/rbac';
import { CompanyStatus } from '@prisma/client';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export interface CompanyAdminItem {
  id: string;
  name: string;
  slug: string;
  phoneNumber: string | null;
  industry: string | null;
  status: CompanyStatus;
  maxBdas: number;
  requestedBdas: number;
  trialEndsAt: Date | null;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  suspendedAt: Date | null;
  suspendReason: string | null;
  createdAt: Date;
  activeBdasCount: number;
  totalLeadsCount: number;
  todayCallsCount: number;
  ceoEmail: string | null;
  ceoName: string | null;
}

export interface SuperAdminDashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  pendingApprovals: number;
  suspendedCompanies: number;
  totalActiveBdas: number;
  totalPlatformLeads: number;
}

/**
 * Loads all company directories, pending verification queues, and usage snapshots
 * for the App-Level Super Admin dashboard.
 */
export async function getSuperAdminDashboardDataAction(): Promise<{
  success: boolean;
  stats?: SuperAdminDashboardStats;
  pendingCompanies?: CompanyAdminItem[];
  activeCompanies?: CompanyAdminItem[];
  impersonatingCompanyId?: string | null;
  error?: string;
}> {
  try {
    const admin = await assertSuperAdmin();

    const cookieStore = await cookies();
    const impersonatingCompanyId = cookieStore.get('heeyaku_impersonate_company_id')?.value || null;

    // Start of Today in Indian Standard Time (UTC+05:30) for daily calls count
    const istFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [yearStr, monthStr, dayStr] = istFormatter.format(new Date()).split('-');
    const startOfTodayIST = new Date(`${yearStr}-${monthStr}-${dayStr}T00:00:00.000+05:30`);

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            leads: true,
            callLogs: true,
          },
        },
      },
    });

    const now = Date.now();
    const mapped: CompanyAdminItem[] = [];

    let totalActiveBdas = 0;
    let totalPlatformLeads = 0;

    for (const c of companies) {
      const activeBdas = c.employees.filter((e) => e.role === 'BDA' && e.isActive);
      const ceo = c.employees.find((e) => e.role === 'CEO') || c.employees[0] || null;
      
      totalActiveBdas += activeBdas.length;
      totalPlatformLeads += c._count.leads;

      let trialDaysRemaining: number | null = null;
      let isTrialExpired = false;
      if (c.trialEndsAt) {
        const diffMs = new Date(c.trialEndsAt).getTime() - now;
        trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        isTrialExpired = diffMs <= 0;
      }

      mapped.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        phoneNumber: c.phoneNumber,
        industry: c.industry,
        status: c.status,
        maxBdas: c.maxBdas,
        requestedBdas: c.requestedBdas,
        trialEndsAt: c.trialEndsAt,
        trialDaysRemaining,
        isTrialExpired,
        verifiedAt: c.verifiedAt,
        verifiedBy: c.verifiedBy,
        rejectionReason: c.rejectionReason,
        suspendedAt: c.suspendedAt,
        suspendReason: c.suspendReason,
        createdAt: c.createdAt,
        activeBdasCount: activeBdas.length,
        totalLeadsCount: c._count.leads,
        todayCallsCount: 0, // Lightweight baseline
        ceoEmail: ceo?.email || null,
        ceoName: ceo?.name || null,
      });
    }

    const pendingCompanies = mapped.filter((c) => c.status === CompanyStatus.PENDING_VERIFICATION);
    const activeCompanies = mapped.filter((c) => c.status !== CompanyStatus.PENDING_VERIFICATION);

    const stats: SuperAdminDashboardStats = {
      totalCompanies: mapped.length,
      activeCompanies: mapped.filter((c) => c.status === CompanyStatus.ACTIVE).length,
      pendingApprovals: pendingCompanies.length,
      suspendedCompanies: mapped.filter((c) => c.status === CompanyStatus.SUSPENDED_BY_ADMIN).length,
      totalActiveBdas,
      totalPlatformLeads,
    };

    return {
      success: true,
      stats,
      pendingCompanies,
      activeCompanies,
      impersonatingCompanyId,
    };
  } catch (err: any) {
    console.error('getSuperAdminDashboardDataAction error:', err);
    return {
      success: false,
      error: err?.message || 'Access denied or failed to load super admin data.',
    };
  }
}

/**
 * 1-Click Master Kill-Switch: Instantly toggles company status between ACTIVE and SUSPENDED_BY_ADMIN.
 */
export async function toggleCompanySuspensionAction(
  companyId: string,
  suspendReason?: string
): Promise<{ success: boolean; status?: CompanyStatus; error?: string }> {
  try {
    const admin = await assertSuperAdmin();

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return { success: false, error: 'Company not found.' };
    }

    const isCurrentlySuspended = company.status === CompanyStatus.SUSPENDED_BY_ADMIN;
    const newStatus = isCurrentlySuspended ? CompanyStatus.ACTIVE : CompanyStatus.SUSPENDED_BY_ADMIN;

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        status: newStatus,
        suspendedAt: isCurrentlySuspended ? null : new Date(),
        suspendReason: isCurrentlySuspended ? null : suspendReason || 'Suspended by Platform Administrator',
      },
    });

    // Invalidate user sessions so change takes effect immediately (0ms lag)
    invalidateUserSessionCache();

    revalidatePath('/super-admin');
    revalidatePath('/admin/dashboard');

    return { success: true, status: updated.status };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to toggle company suspension.' };
  }
}

/**
 * Approves a pending company registration and activates their 30-day trial.
 */
export async function approveCompanyAction(
  companyId: string,
  approvedBdas: number = 5,
  trialDays: number = 30
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertSuperAdmin();

    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        status: CompanyStatus.ACTIVE,
        maxBdas: Math.max(1, approvedBdas),
        trialEndsAt,
        verifiedAt: new Date(),
        verifiedBy: admin.email,
        rejectionReason: null,
      },
    });

    invalidateUserSessionCache();
    revalidatePath('/super-admin');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to approve company.' };
  }
}

/**
 * Rejects a pending company registration.
 */
export async function rejectCompanyAction(
  companyId: string,
  rejectionReason: string = 'Application did not meet verification criteria.'
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSuperAdmin();

    await prisma.company.update({
      where: { id: companyId },
      data: {
        status: CompanyStatus.REJECTED,
        rejectionReason,
      },
    });

    invalidateUserSessionCache();
    revalidatePath('/super-admin');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reject company.' };
  }
}

/**
 * Adjusts the approved BDA caller seat limit for a company.
 */
export async function updateCompanySeatsAction(
  companyId: string,
  maxBdas: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSuperAdmin();

    if (maxBdas < 1) {
      return { success: false, error: 'Caller seat limit must be at least 1.' };
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { maxBdas },
    });

    invalidateUserSessionCache();
    revalidatePath('/super-admin');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update seats.' };
  }
}

/**
 * Extends a company's trial period by the specified number of days (e.g. +15 or +30).
 */
export async function extendCompanyTrialAction(
  companyId: string,
  extraDays: number = 30
): Promise<{ success: boolean; newTrialEndsAt?: Date; error?: string }> {
  try {
    await assertSuperAdmin();

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return { success: false, error: 'Company not found.' };

    const baseDate = company.trialEndsAt && new Date(company.trialEndsAt).getTime() > Date.now()
      ? new Date(company.trialEndsAt)
      : new Date();

    const newTrialEndsAt = new Date(baseDate.getTime() + extraDays * 24 * 60 * 60 * 1000);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        trialEndsAt: newTrialEndsAt,
      },
    });

    invalidateUserSessionCache();
    revalidatePath('/super-admin');

    return { success: true, newTrialEndsAt };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to extend trial.' };
  }
}

/**
 * Ghost Mode: Impersonates a company to troubleshoot or inspect as platform owner.
 */
export async function impersonateCompanyAction(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSuperAdmin();

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return { success: false, error: 'Target company not found.' };

    const cookieStore = await cookies();
    cookieStore.set('heeyaku_impersonate_company_id', companyId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2, // 2 hours max session
    });

    invalidateUserSessionCache();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to enter ghost mode.' };
  }
}

/**
 * Exits Ghost Mode impersonation and restores standard Super Admin view.
 */
export async function clearImpersonationAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete('heeyaku_impersonate_company_id');
  invalidateUserSessionCache();
  return { success: true };
}

/**
 * Deletes a company and cascades removal of test/spam registrations.
 */
export async function deleteCompanyAction(
  companyId: string,
  confirmedName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSuperAdmin();

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return { success: false, error: 'Company not found.' };

    if (confirmedName.trim().toLowerCase() !== company.name.trim().toLowerCase()) {
      return { success: false, error: 'Confirmation company name does not match.' };
    }

    if (company.slug === 'heeyaku-primary') {
      return { success: false, error: 'Cannot delete the primary root organization.' };
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    invalidateUserSessionCache();
    revalidatePath('/super-admin');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete company.' };
  }
}
