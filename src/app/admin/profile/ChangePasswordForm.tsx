'use client';

/**
 * Form de troca de senha do próprio usuário.
 *
 * Submit → POST /api/account/change-password.
 * Validações de UX (comprimento, mismatch) são duplicadas no client pra feedback
 * imediato; o backend é a fonte da verdade.
 *
 * Sucesso → toast verde "Senha alterada com sucesso" e limpa os campos.
 * Erro → toast vermelho com a mensagem retornada pela API.
 */
import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/ui/Toast';

export function ChangePasswordForm() {
  const toastApi = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toastApi.error('Preencha todos os campos.');
      return;
    }
    if (newPassword.length < 8) {
      toastApi.error('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toastApi.error('A nova senha e a confirmação não batem.');
      return;
    }
    if (newPassword === currentPassword) {
      toastApi.error('A nova senha deve ser diferente da atual.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          typeof data?.error === 'string' && data.error
            ? data.error
            : `Erro ${res.status}`;
        toastApi.error(msg);
        return;
      }
      toastApi.success('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toastApi.error(err instanceof Error ? err.message : 'Erro de rede.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md" autoComplete="off">
      <div>
        <label htmlFor="currentPassword" className="block text-label text-text-muted mb-1.5">
          Senha atual
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={busy}
          autoComplete="current-password"
          className="w-full px-3 py-2 bg-card border border-border-subtle rounded-input text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-label text-text-muted mb-1.5">
          Nova senha
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="mínimo 8 caracteres"
          required
          minLength={8}
          disabled={busy}
          autoComplete="new-password"
          className="w-full px-3 py-2 bg-card border border-border-subtle rounded-input text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="confirmNewPassword" className="block text-label text-text-muted mb-1.5">
          Confirmar nova senha
        </label>
        <input
          id="confirmNewPassword"
          name="confirmNewPassword"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="repita a nova senha"
          required
          minLength={8}
          disabled={busy}
          autoComplete="new-password"
          className="w-full px-3 py-2 bg-card border border-border-subtle rounded-input text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-input bg-accent text-white text-label font-medium hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {busy ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </div>
    </form>
  );
}