/**
 * Página /admin/profile — qualquer usuário logado (qualquer role: dev/admin/user) pode:
 *   1. Ver seu próprio nome + email (read-only).
 *   2. Trocar a própria senha (form com senha atual, nova, confirmar).
 *
 * Server Component valida sessão e passa nome/email para o Client Component do form.
 * O middleware (src/middleware.ts) garante que /admin/* só é acessível logado.
 *
 * Defesa-em-profundidade: se a sessão sumir entre o SSR e a ação (improvável), a própria API
 * valida de novo com getCurrentUser().
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { ChangePasswordForm } from './ChangePasswordForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const displayName = user.name?.trim() || user.email.split('@')[0];

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-label text-text-muted">
        <Link
          href="/admin"
          className="hover:text-accent transition-colors duration-150"
        >
          ← Voltar
        </Link>
        <span className="mx-2">·</span>
        <span className="text-text">Meu perfil</span>
      </nav>

      <div className="mt-2 mb-6">
        <h1 className="text-h1 text-text font-semibold">Meu perfil</h1>
        <p className="text-body text-text-muted mt-1">
          Seus dados de identificação são somente leitura. Para trocar a senha,
          preencha o formulário abaixo — você precisará informar a senha atual.
        </p>
      </div>

      {/* Card de identidade (read-only) */}
      <section
        aria-labelledby="identity-heading"
        className="bg-card border border-border-subtle rounded-card p-4 sm:p-5 mb-5 shadow-card"
      >
        <h2 id="identity-heading" className="text-caption uppercase tracking-wide text-text-muted font-semibold mb-3">
          Identidade
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="sm:col-span-1">
            <dt className="text-label text-text-muted">Nome</dt>
            <dd className="text-body text-text mt-0.5">{displayName}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-label text-text-muted">Email</dt>
            <dd className="text-body text-text font-mono mt-0.5 break-all">{user.email}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-label text-text-muted">Role</dt>
            <dd className="mt-1">
              <RoleBadge role={user.role} />
            </dd>
          </div>
        </dl>
      </section>

      {/* Card de troca de senha */}
      <section
        aria-labelledby="password-heading"
        className="bg-card border border-border-subtle rounded-card p-4 sm:p-5 shadow-card"
      >
        <h2 id="password-heading" className="text-caption uppercase tracking-wide text-text-muted font-semibold mb-3">
          Trocar senha
        </h2>
        <ChangePasswordForm />
      </section>
    </main>
  );
}