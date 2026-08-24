/**
 * Lista de usuários (CRUD). Server Component.
 *
 * Mostra: email, nome, role (badge), ativo, criado em.
 * Botões por linha: Editar, Resetar senha, Ativar/Desativar.
 * Top right: "+ Novo user" (visível só pra canManageUsers).
 *
 * RBAC:
 * - dev, admin: veem lista + botões de gestão
 * - user: 403 (página inteira) — não vê nada
 *
 * Página é parte de "Configuração" → só dev chega aqui via UI.
 * Mas defense-in-depth: API valida também.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canManageUsers, type Role } from '@/lib/permissions';
import { Pill } from '@/components/ui/Pill';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { UserRowActions } from './UserRowActions';
import { NewUserButton } from './NewUserButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  ativo: boolean;
  criadoEm: Date;
};

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function UsersPage() {
  const actor = await getCurrentUser();
  if (!actor) redirect('/admin/login');

  // Defense-in-depth: mesmo que o middleware deixe passar, valida role aqui.
  if (!canManageUsers(actor.role as Role)) {
    return (
      <main className="p-4 sm:p-6 md:p-8 max-w-3xl">
        <h1 className="text-h1 text-text font-semibold">Acesso negado</h1>
        <p className="text-body text-text-muted mt-2">
          Você não tem permissão pra gerenciar usuários.
        </p>
      </main>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ativo: true,
      criadoEm: true,
    },
  });

  const rows: UserRow[] = users;

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-label text-text-muted">
        <Link
          href="/admin"
          className="hover:text-accent transition-colors duration-150"
        >
          ← Voltar
        </Link>
        <span className="mx-2">·</span>
        <span>Configuração</span>
        <span className="mx-2">·</span>
        <span className="text-text">Usuários</span>
      </nav>

      <div className="mt-2 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text font-semibold">Usuários</h1>
          <p className="text-body text-text-muted mt-1">
            Gestão de quem acessa o painel admin. Roles: <Pill>dev</Pill> tem
            tudo; <Pill>admin</Pill> não vê Config; <Pill>user</Pill> é
            somente leitura.
          </p>
        </div>
        <NewUserButton actorRole={actor.role as Role} />
      </div>

      <div className="bg-card border border-border-subtle rounded-card overflow-hidden shadow-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border-subtle bg-card-elevated">
          <span className="text-caption uppercase tracking-wide text-text-muted">
            {rows.length} usuário{rows.length === 1 ? '' : 's'}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead className="bg-card-elevated">
                <tr className="text-left">
                  <th className="px-4 py-3 text-caption uppercase tracking-wide text-text-muted font-semibold">
                    Email
                  </th>
                  <th className="px-4 py-3 text-caption uppercase tracking-wide text-text-muted font-semibold">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-caption uppercase tracking-wide text-text-muted font-semibold">
                    Role
                  </th>
                  <th className="px-4 py-3 text-caption uppercase tracking-wide text-text-muted font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-caption uppercase tracking-wide text-text-muted font-semibold">
                    Criado em
                  </th>
                  <th className="px-4 py-3 text-caption uppercase tracking-wide text-text-muted font-semibold text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border-subtle hover:bg-card-elevated/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-text">{u.email}</td>
                    <td className="px-4 py-3 text-text">{u.name || '—'}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <Pill variant={u.ativo ? 'active' : 'inactive'}>
                        {u.ativo ? 'ativo' : 'inativo'}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {fmtDate(u.criadoEm)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserRowActions
                        user={u}
                        actorRole={actor.role as Role}
                        actorId={actor.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}