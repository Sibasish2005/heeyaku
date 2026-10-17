import { redirect } from 'next/navigation';

/**
 * Root index route for /admin.
 * Redirects to /admin/dashboard.
 * Super Admins are automatically routed to /super-admin by /admin/layout.tsx.
 */
export default function AdminIndexPage() {
  redirect('/admin/dashboard');
}
