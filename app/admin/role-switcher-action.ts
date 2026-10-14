'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { invalidateUserSessionCache, getAuthenticatedUser } from '@/lib/auth/rbac';

/**
 * Allows verified CEOs to test and simulate different role perspectives
 * (CEO, Team Lead, HR, BDA) without needing multiple accounts.
 */
export async function switchSimulatedRoleAction(targetRole: string | null) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.isRealCeo) {
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
