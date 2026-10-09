'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { invalidateUserSessionCache } from '@/lib/auth/rbac';
import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Allows verified CEOs to test and simulate different role perspectives
 * (CEO, Team Lead, HR, BDA) without needing multiple accounts.
 */
export async function switchSimulatedRoleAction(targetRole: string | null) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized: User not authenticated.' };

    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser?.emailAddresses[0]?.emailAddress;

    const rawAdminEmails = process.env.ADMIN_EMAIL || '';
    const allowedCeoEmails = rawAdminEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!primaryEmail || !allowedCeoEmails.includes(primaryEmail.toLowerCase().trim())) {
      return { success: false, error: 'Unauthorized: Only authorized CEOs can simulate other role perspectives.' };
    }

    const cookieStore = await cookies();
    if (!targetRole || targetRole === 'CEO' || targetRole === 'RESET') {
      cookieStore.delete('heeyaku_simulated_role');
    } else if (['HR', 'TEAM_LEAD', 'BDA'].includes(targetRole)) {
      cookieStore.set('heeyaku_simulated_role', targetRole, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
      });
    }

    invalidateUserSessionCache();
    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/employees');
    revalidatePath('/admin/teams');
    revalidatePath('/admin/leads');

    return { success: true, activeRole: targetRole || 'CEO' };
  } catch (error) {
    console.error('Error switching simulated role:', error);
    return { success: false, error: 'Failed to switch role.' };
  }
}
