'use client';

/**
 * Botão "+ Novo user" no header da lista. Leva pra /admin/users/novo.
 *
 * Defense-in-depth: a página /admin/users/novo já valida role via server,
 * mas escondemos o link aqui pra UX clara (não confundir user que não pode).
 */
import Link from 'next/link';
import { canManageUsers, type Role } from '@/lib/permissions';

export function NewUserButton({ actorRole }: { actorRole: Role }) {
  if (!canManageUsers(actorRole)) return null;
  return (
    <Link
      href="/admin/users/novo"
      className="self-start inline-flex items-center gap-1.5 text-label font-medium px-3 py-1.5 bg-accent text-white rounded-pill hover:bg-accent-hover transition-colors duration-150"
    >
      + Novo user
    </Link>
  );
}