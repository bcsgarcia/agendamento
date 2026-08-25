'use client';

// Modal de confirmação forte: usuário precisa digitar "DELETAR" pra confirmar.
// Igual ao padrão de apps que deletam dados sensíveis (Vercel, GitHub em deletes destrutivos).

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/components/ui/cn';

const REQUIRED = 'DELETAR';

export function DeleteConfirmModal({
  open,
  pending,
  reason,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pending: boolean;
  /** Texto curto da urgência (ex: reason) — exibido no corpo pra desambiguar. */
  reason: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state + autofocus ao abrir
  useEffect(() => {
    if (open) {
      setTyped('');
      // pequeno delay pra não lutar com a animação do dialog
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Esc fecha
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  const canConfirm = typed === REQUIRED && !pending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canConfirm) onConfirm();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar"
        onClick={pending ? undefined : onCancel}
        className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm"
      />
      {/* Card */}
      <div className="relative bg-card border border-border-subtle rounded-card shadow-glow p-5 w-full max-w-md">
        <button
          type="button"
          onClick={pending ? undefined : onCancel}
          aria-label="Fechar"
          className="absolute top-3 right-3 p-1 rounded-md text-text-muted hover:bg-card-elevated hover:text-text transition-colors duration-150"
        >
          <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className="shrink-0 w-9 h-9 rounded-pill grid place-items-center bg-danger/15 text-danger"
            aria-hidden="true"
          >
            <AlertTriangle className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-modal-title" className="text-h2 text-text font-semibold">
              Deletar urgência definitivamente?
            </h3>
            <p className="mt-2 text-body text-text-muted">
              A entrada será removida do banco de dados. Esta ação{' '}
              <strong className="text-danger">não pode ser desfeita</strong>.
            </p>
            <p className="mt-2 text-caption text-text-muted">
              Urgência: <span className="text-text font-medium">{reason}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <label htmlFor="delete-confirm-input" className="text-label text-text font-medium">
            Digite <code className="font-mono text-danger bg-danger/10 px-1.5 py-0.5 rounded-md">DELETAR</code> pra confirmar:
          </label>
          <input
            ref={inputRef}
            id="delete-confirm-input"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={pending}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              'mt-1.5 w-full px-3 py-2 rounded-card text-body font-mono',
              'bg-app-bg border border-border-subtle text-text',
              'focus:outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger/40',
              'disabled:opacity-50',
            )}
          />

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className={cn(
                'px-4 py-2 rounded-card text-label font-medium',
                'border border-border-subtle bg-card text-text',
                'hover:bg-card-elevated transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-accent/30',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canConfirm}
              className={cn(
                'px-4 py-2 rounded-card text-label font-medium',
                'bg-danger text-white hover:opacity-90 active:opacity-80',
                'transition-opacity duration-150',
                'focus:outline-none focus:ring-2 focus:ring-danger/40',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {pending ? 'Deletando…' : 'Deletar definitivamente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
