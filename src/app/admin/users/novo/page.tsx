/**
 * Página "Novo usuário" — formulário de criação com seleção de role filtrada.
 *
 * Server Component valida role do ator; Client Component (`NewUserForm`)
 * faz POST /api/admin/users e exibe GeneratedPasswordModal ao receber senha.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageUsers, type Role } from '@/lib/permissions';
import { NewUserForm } from './NewUserForm';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const actor = await getCurrentUser();
  if (!actor) redirect('/admin/login');
  if (!canManageUsers(actor.role as Role)) {
    return (
      <main className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-h1 text-text font-semibold">Acesso negado</h1>
        <p className="text-body text-text-muted mt-2">
          Você não tem permissão pra criar usuários.
        </p>
      </main>
    );
  }

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
        <span className="text-text">Novo</span>
      </nav>

      <div className="mt-2 mb-6">
        <h1 className="text-h1 text-text font-semibold">Novo usuário</h1>
        <p className="text-body text-text-muted mt-1">
          O sistema gera uma senha aleatória de 8 dígitos. Você verá a senha
          uma única vez — copie antes de fechar.
        </p>
      </div>

      <NewUserForm actorRole={actor.role as Role} />
    </main>
  );
}