'use client';

/**
 * Form de criação de user — Client Component.
 *
 * Seleciona role dinamicamente baseado em canAssignRole(actor, target).
 * Submit → POST /api/admin/users → GeneratedPasswordModal com a senha UMA VEZ.
 *
 * Após fechar o modal, redireciona pra /admin/users (lista).
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { canAssignRole, type Role, ROLES } from '@/lib/permissions';
import { GeneratedPasswordModal } from '@/components/admin/GeneratedPasswordModal';

interface Props {
  actorRole: Role;
}

const ROLE_LABEL: Record<Role, string> = {
  dev: 'dev (tudo)',
  admin: 'admin (sem Config)',
  user: 'user (somente leitura)',
};

export function NewUserForm({ actorRole }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(() => {
    // Default: a role mais alta que o ator pode atribuir (que não seja dev se for admin)
    if (canAssignRole(actorRole, 'admin')) return 'admin';
    if (canAssignRole(actorRole, 'user')) return 'user';
    return 'user';
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const assignableRoles = ROLES.filter((r) => canAssignRole(actorRole, r));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Informe o email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Email inválido.');
      return;
    }
    if (!canAssignRole(actorRole, role)) {
      setError(`Você não pode atribuir o role "${role}".`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          role,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? `Erro ${res.status}`);
        return;
      }
      const data = await res.json();
      setGeneratedPassword(data.generatedPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro de rede');
    } finally {
      setBusy(false);
    }
  }

  function closeModal() {
    setGeneratedPassword(null);
    router.push('/admin/users');
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="email" className="block text-label text-text-muted mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@dominio.com"
            required
            disabled={busy}
            className="w-full px-3 py-2 bg-card border border-border-subtle rounded-input text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-label text-text-muted mb-1.5">
            Nome <span className="text-text-muted/60">(opcional)</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            disabled={busy}
            className="w-full px-3 py-2 bg-card border border-border-subtle rounded-input text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-label text-text-muted mb-1.5">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={busy}
            className="w-full px-3 py-2 bg-card border border-border-subtle rounded-input text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          >
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-caption text-text-muted">
            Você só vê roles que pode atribuir.
          </p>
        </div>

        {error && (
          <div className="text-caption text-danger bg-danger/10 border border-danger/30 rounded-input px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-input bg-accent text-white text-label font-medium hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {busy ? 'Criando…' : 'Criar usuário'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            disabled={busy}
            className="px-4 py-2 rounded-input bg-app-bg border border-border-subtle text-text text-label hover:bg-card-elevated transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </form>

      {generatedPassword && (
        <GeneratedPasswordModal
          password={generatedPassword}
          onClose={closeModal}
        />
      )}
    </>
  );
}