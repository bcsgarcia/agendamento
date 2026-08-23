'use client';

// Dialog de confirmação Dark Violet — substitui window.confirm com UX consistente.
// Estado controlado: `open` + `onConfirm` + `onCancel`.
//
// Uso típico:
//   const [ask, setAsk] = useState(false);
//   if (ask) {
//     return (
//       <ConfirmDialog
//         open
//         title="Cancelar esta aula?"
//         description="Inscritos existentes serão preservados (audit)…"
//         confirmLabel="Cancelar aula"
//         variant="danger"
//         onConfirm={async () => { await action(); setAsk(false); }}
//         onCancel={() => setAsk(false)}
//       />
//     );
//   }
//   return <button onClick={() => setAsk(true)}>…</button>;

import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { cn } from './cn';

type Variant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  /** Quando true, mostra spinner no botão de confirmação e desabilita ambos. */
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ICONS: Record<Variant, typeof AlertTriangle> = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const ICON_BG: Record<Variant, string> = {
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-success/15 text-success',
  info: 'bg-accent/15 text-accent-glow-bright',
};

const CONFIRM_BG: Record<Variant, string> = {
  danger: 'bg-danger text-white hover:opacity-90 active:opacity-80',
  warning: 'bg-success text-white hover:opacity-90 active:opacity-80',
  info: 'bg-accent text-white hover:bg-accent-hover active:opacity-80',
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Esc fecha o diálogo
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  const Icon = ICONS[variant];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
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
        {/* Botão X no canto superior direito */}
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
            className={cn(
              'shrink-0 w-9 h-9 rounded-pill grid place-items-center',
              ICON_BG[variant],
            )}
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-h2 text-text font-semibold"
            >
              {title}
            </h3>
            {description && (
              <div className="mt-2 text-body text-text-muted">{description}</div>
            )}
          </div>
        </div>

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
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              'px-4 py-2 rounded-card text-label font-medium',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent/40',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              CONFIRM_BG[variant],
            )}
          >
            {pending ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hook utilitário: encapsula o padrão open/onConfirm/onCancel ───
// Mantém o estado interno e expõe `ask()`, `Dialog` (para renderizar uma vez).
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  function ask() {
    setOpen(true);
  }

  function close() {
    if (pending) return;
    setOpen(false);
  }

  return { open, pending, setPending, ask, close };
}