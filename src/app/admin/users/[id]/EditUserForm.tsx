'use client';

/**
 * Form de edição de user — Client Component.
 *
 * Campos editáveis: nome, role (filtrado por canAssignRole), ativo.
 * Botão "Resetar senha" chama POST /api/admin/users/[id]/reset-password
 * e abre GeneratedPasswordModal com a senha UMA VEZ.
 *
 * Email é read-only (imutável).
 *
 * RBAC:
 * - canEdit=false (user role) → todos os campos ficam disabled
 * - canReset=false → botão "Resetar senha" desabilitado
 * - Atribuir role só é possível se canAssignRole(actor, targetRole) — select
 *   já vem filtrado do server side
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { canAssignRole, type Role } from '@/lib/permissions';
import { GeneratedPasswordModal } from '@/components/admin/GeneratedPasswordModal';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  ativo: boolean;
}

interface Props {
  user: UserData;
  actorRole: Role;
  actorId: string;
  canEdit: boolean;
  canReset: boolean;
  assignableRoles: Role[];
}

const ROLE_LABEL: Record<Role, string> = {
  dev: 'dev (tudo)',
  admin: 'admin (sem Config)',
  user: 'user (somente leitura)',
};

export function EditUserForm({
  user,
  actorRole,
  actorId,
  canEdit,
  canReset,
  assignableRoles,
}: Props) {
  const router = useRouter();
  const initialRole: Role =
    user.role === 'dev' || user.role === 'admin' || user.role === 'user'
      ? user.role
      : 'user';

  const [name, setName] = useState(user.name ?? '');
  const [role, setRole] = useState<Role>(initialRole);
  const [ativo, setAtivo] = useState(user.ativo);
  const [busy, setBusy] = useState<'save' | 'reset' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const isSelf = user.id === actorId;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canEdit) {
      setError('Sem permissão pra editar.');
      return;
    }
    // Não permite rebaixar/devolver o próprio role se for o último dev? Decisão: 
    // permitimos admin/dev alterarem o role, mas a checagem server-side vai barrar
    // se canAssignRole for false (ex: admin não pode promover pra dev).
    if (!canAssignRole(actorRole, role)) {
      setError(`Você não pode atribuir o role "${role}".`);
      return;
    }

    // Não desativar a si mesmo
    if (isSelf && !ativo) {
      setError('Você não pode desativar seu próprio usuário.');
      return;
    }

    setBusy('save');
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() === '' ? null : name.trim(),
          role,
          ativo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? `Erro ${res.status}`);
        return;
      }
      setSuccess('Salvo.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro de rede');
    } finally {
      setBusy(null);
    }
  }

  async function handleReset() {
    setError(null);
    setSuccess(null);
    if (!canReset) return;
    setBusy('reset');
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setBusy(null);
    }
  }

  return (
    <>
      {!canEdit && (
        <div className="mb-4 px-4 py-3 bg-warning/10 border border-warning/30 rounded-input text-caption text-warning">
          Acesso somente leitura. Seu role não permite edições.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="email" className="block text-label text-text-muted mb-1.5">
            Email <span className="text-text-muted/60">(imutável)</span>
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            disabled
            readOnly
            className="w-full px-3 py-2 bg-app-bg border border-border-subtle rounded-input text-text-muted font-mono cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-label text-text-muted mb-1.5">
            Nome
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit || busy !== null}
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
            disabled={!canEdit || busy !== null}
            className="w-full px-3 py-2 bg-card border border-border-subtle rounded-input text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          >
            {/* Mostra role atual mesmo se não puder atribuir (read-only state) */}
            {!assignableRoles.includes(initialRole) && (
              <option value={initialRole}>{ROLE_LABEL[initialRole]}</option>
            )}
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

        <div>
          <label
            htmlFor="ativo"
            className="flex items-center gap-2 text-label text-text-muted"
          >
            <input
              id="ativo"
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              disabled={!canEdit || (isSelf && ativo) || busy !== null}
              className="w-4 h-4 rounded border-border-subtle text-accent focus:ring-accent disabled:opacity-60"
            />
            Usuário ativo
          </label>
          {isSelf && ativo && (
            <p className="mt-1 text-caption text-text-muted">
              Você não pode desativar seu próprio usuário (evita lockout).
            </p>
          )}
        </div>

        {error && (
          <div className="text-caption text-danger bg-danger/10 border border-danger/30 rounded-input px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-caption text-success bg-success/10 border border-success/30 rounded-input px-3 py-2">
            {success}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!canEdit || busy !== null}
            className="px-4 py-2 rounded-input bg-accent text-white text-label font-medium hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {busy === 'save' ? 'Salvando…' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!canReset || busy !== null}
            title={
              canReset
                ? 'Gerar nova senha de 8 dígitos'
                : 'Você não pode resetar a senha desse usuário.'
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-input bg-app-bg border border-border-subtle text-text text-label hover:bg-card-elevated transition-colors disabled:opacity-60"
          >
            <KeyRound className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            {busy === 'reset' ? '…' : 'Resetar senha'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            disabled={busy !== null}
            className="px-4 py-2 rounded-input bg-app-bg border border-border-subtle text-text text-label hover:bg-card-elevated transition-colors disabled:opacity-60"
          >
            Voltar
          </button>
        </div>
      </form>

      {generatedPassword && (
        <GeneratedPasswordModal
          password={generatedPassword}
          onClose={() => {
            setGeneratedPassword(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}