'use client';

/**
 * Ações por linha da tabela de users: Editar, Resetar senha, Ativar/Desativar.
 *
 * - Editar: link pra /admin/users/[id]
 * - Resetar senha: client-side fetch POST /api/admin/users/[id]/reset-password
 *   → abre GeneratedPasswordModal com a senha UMA VEZ
 * - Ativar/Desativar: PATCH /api/admin/users/[id] com { ativo: !u.ativo }
 * - Excluir (soft delete via ativo=false está em "Desativar" pra dev apenas):
 *   DELETE /api/admin/users/[id] — APENAS dev.
 *
 * RBAC:
 * - dev: pode editar/resetar/desativar/excluir qualquer user (incluindo outros dev)
 * - admin: pode editar/resetar/desativar admin/user; NÃO pode atribuir dev
 *   nem resetar senha de dev; NÃO pode excluir
 * - user: NÃO chega aqui (403 da página)
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { KeyRound, Power, Trash2 } from 'lucide-react';
import {
  canAssignRole,
  canDeleteUsers,
  canManageUsers,
  canResetPassword,
  type Role,
} from '@/lib/permissions';
import { GeneratedPasswordModal } from '@/components/admin/GeneratedPasswordModal';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  ativo: boolean;
  criadoEm: Date;
}

interface Props {
  user: UserRow;
  actorRole: Role;
  actorId: string;
}

export function UserRowActions({ user, actorRole, actorId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<'reset' | 'toggle' | 'delete' | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetRole = (user.role === 'dev' || user.role === 'admin' || user.role === 'user'
    ? user.role
    : 'user') as Role;

  const canEdit = canManageUsers(actorRole);
  const canReset = canResetPassword(actorRole, targetRole);
  const canDelete = canDeleteUsers(actorRole);
  // Edição de role só permitida se pode atribuir o role atual (impossível subir de user pra dev
  // sem ser dev, e admin não pode mexer em dev). Mas nome/ativo sempre pode (admin ou dev).
  const canChangeRole = canAssignRole(actorRole, targetRole);

  async function handleReset() {
    setError(null);
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

  async function handleToggleAtivo() {
    setError(null);
    setBusy('toggle');
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !user.ativo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? `Erro ${res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro de rede');
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir (soft) usuário ${user.email}? Esta ação é só pra dev.`)) {
      return;
    }
    setError(null);
    setBusy('delete');
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? `Erro ${res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro de rede');
    } finally {
      setBusy(null);
    }
  }

  // user role não chega aqui (403), mas defensivo:
  if (!canEdit) return null;

  // Bloqueia editar a si próprio? Não — pode editar nome/ativo próprios,
  // mas não promover pra outro role nem desativar a si mesmo (evita lockout).
  const isSelf = user.id === actorId;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <Link
          href={`/admin/users/${user.id}`}
          aria-disabled={isSelf && !canChangeRole}
          className="inline-flex items-center justify-center text-label px-2.5 py-1 border border-border-subtle rounded-card bg-card text-text hover:bg-card-elevated transition-colors duration-150"
        >
          Editar
        </Link>

        <button
          type="button"
          onClick={handleReset}
          disabled={!canReset || busy !== null}
          title={
            !canReset
              ? 'Você não pode resetar a senha desse usuário.'
              : 'Gerar nova senha de 8 dígitos'
          }
          className="inline-flex items-center justify-center gap-1.5 text-label px-2.5 py-1 border border-border-subtle rounded-card bg-card text-text hover:bg-card-elevated transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <KeyRound className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
          {busy === 'reset' ? '…' : 'Resetar senha'}
        </button>

        <button
          type="button"
          onClick={handleToggleAtivo}
          disabled={busy !== null || (isSelf && user.ativo)}
          title={
            isSelf && user.ativo
              ? 'Você não pode desativar seu próprio usuário.'
              : user.ativo
                ? 'Desativar'
                : 'Ativar'
          }
          className="inline-flex items-center justify-center gap-1.5 text-label px-2.5 py-1 border border-border-subtle rounded-card bg-card text-text hover:bg-card-elevated transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Power className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
          {busy === 'toggle' ? '…' : user.ativo ? 'Desativar' : 'Ativar'}
        </button>

        {canDelete && !isSelf && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            title="Excluir (soft delete) — apenas dev"
            className="inline-flex items-center justify-center gap-1.5 text-label px-2.5 py-1 border border-danger/40 rounded-card bg-card text-danger hover:bg-danger/10 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            {busy === 'delete' ? '…' : 'Excluir'}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-caption text-danger text-right">{error}</p>
      )}

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