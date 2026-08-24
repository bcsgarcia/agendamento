/**
 * Página de detalhe/edição de um user.
 *
 * Server Component valida role do ator e carrega user.
 * Client Component (`EditUserForm`) faz PATCH /api/admin/users/[id].
 * Botão "Resetar senha" abre GeneratedPasswordModal.
 *
 * Email é IMUTÁVEL (preserva audit). Senha só via reset.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  canAssignRole,
  canEditInAdmin,
  canManageUsers,
  canResetPassword,
  type Role,
} from '@/lib/permissions';
import { EditUserForm } from './EditUserForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function EditUserPage({ params }: PageProps) {
  const actor = await getCurrentUser();
  if (!actor) redirect('/admin/login');

  if (!canManageUsers(actor.role as Role)) {
    return (
      <main className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-h1 text-text font-semibold">Acesso negado</h1>
        <p className="text-body text-text-muted mt-2">
          Você não tem permissão pra editar usuários.
        </p>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ativo: true,
      criadoEm: true,
    },
  });
  if (!user) notFound();

  const targetRole = (user.role === 'dev' || user.role === 'admin' || user.role === 'user'
    ? user.role
    : 'user') as Role;

  const canEdit = canEditInAdmin(actor.role as Role);
  const canReset = canResetPassword(actor.role as Role, targetRole);
  // Role que o ator pode atribuir — filtra opções do select.
  const assignableRoles = (['dev', 'admin', 'user'] as Role[]).filter((r) =>
    canAssignRole(actor.role as Role, r),
  );

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <nav aria-label="Breadcrumb" className="text-label text-text-muted">
        <Link
          href="/admin/users"
          className="hover:text-accent transition-colors duration-150"
        >
          ← Voltar
        </Link>
        <span className="mx-2">·</span>
        <Link href="/admin/users" className="hover:text-accent transition-colors">
          Usuários
        </Link>
        <span className="mx-2">·</span>
        <span className="text-text">{user.email}</span>
      </nav>

      <div className="mt-2 mb-6">
        <h1 className="text-h1 text-text font-semibold">
          Editar usuário
        </h1>
        <p className="text-body text-text-muted mt-1">
          Email é imutável (preserva audit log). Senha só pode ser alterada via reset.
        </p>
      </div>

      <EditUserForm
        user={user}
        actorRole={actor.role as Role}
        actorId={actor.id}
        canEdit={canEdit}
        canReset={canReset}
        assignableRoles={assignableRoles}
      />
    </main>
  );
}