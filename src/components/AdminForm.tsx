// Botões e helpers padrão usados nos forms admin (Dark Violet)
// Tokens: bg-card, border-subtle, text, text-muted, accent, danger
import Link from 'next/link';

/**
 * Classe-base para inputs dark (text/email/url/date/datetime-local/number/select/textarea).
 * Aplicar com `className={inputClass}` (cn não é necessário porque é só uma classe).
 *
 * Especificação PR-5:
 *   - bg `card` (#1E1C2A), border `border-subtle`, text `text`, placeholder `text-muted`
 *   - Focus: border `accent`, ring-2 `accent/30`
 *   - Erro: border `danger` (aplicar manualmente via className extra quando preciso)
 */
export const inputClass =
  'w-full bg-card border border-border-subtle rounded-card px-3 py-2 ' +
  'text-body text-text placeholder:text-text-muted ' +
  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 ' +
  'transition-colors duration-150';

/** Label de campo (12px / 500 / text-muted). */
export const labelClass = 'block text-label font-medium text-text-muted mb-1';

/**
 * Hint/ajuda exibida abaixo de um input (12px / 400 / text-muted).
 */
export const hintClass = 'text-caption text-text-muted mt-1';

export function SubmitButton({
  label,
  pendingLabel = 'Salvando…',
  variant = 'primary',
  pending = false,
}: {
  label: string;
  pendingLabel?: string;
  variant?: 'primary' | 'danger';
  pending?: boolean;
}) {
  const base =
    'w-full sm:w-auto px-4 py-2 rounded-card text-label font-medium transition-colors duration-150 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';
  const colors =
    variant === 'danger'
      ? 'bg-danger text-white hover:opacity-90 active:opacity-80'
      : 'bg-accent text-white hover:bg-accent-hover active:opacity-80';
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${base} ${colors} focus:outline-none focus:ring-2 focus:ring-accent/40`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function CancelLink({
  href,
  label = 'Cancelar',
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className={
        'w-full sm:w-auto text-center px-4 py-2 rounded-card text-label font-medium ' +
        'border border-border-subtle bg-card text-text ' +
        'hover:bg-card-elevated transition-colors duration-150 ' +
        'focus:outline-none focus:ring-2 focus:ring-accent/30'
      }
    >
      {label}
    </Link>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="p-3 mb-4 text-label bg-danger/10 border border-danger/40 text-danger rounded-card"
    >
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="p-3 mb-4 text-label bg-success/10 border border-success/40 text-success rounded-card"
    >
      {message}
    </div>
  );
}
