import { AdminShell } from '@/components/AdminShell';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function initialsFromName(name: string | null | undefined, email: string): string {
  const source = (name && name.trim()) || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Auth é enforced pelo middleware (src/middleware.ts) — sem cookie, request nunca chega aqui.
  // Se chegar user=null é só porque DB falhou (ex: ambiente de preview sem Postgres);
  // mostramos fallback com placeholders para não quebrar render.
  const email = user?.email ?? '';
  const displayName = user?.name?.trim() || email.split('@')[0] || 'Admin';
  const initials = initialsFromName(user?.name, email || 'admin@local');

  return (
    <AdminShell userName={displayName} userInitials={initials}>
      {children}
    </AdminShell>
  );
}
