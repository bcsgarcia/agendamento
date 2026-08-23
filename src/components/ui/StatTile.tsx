import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface StatTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Rótulo pequeno acima do valor (caption muted). */
  label: string;
  /** Valor principal exibido em destaque (h2). */
  value: ReactNode;
  /** Ícone opcional alinhado à direita. */
  icon?: ReactNode;
}

/**
 * Tile para KPIs / métricas (label + valor + ícone opcional).
 *
 * Estrutura semântica:
 *   - <div> raiz (flex row, label/value à esquerda, ícone à direita)
 *   - <span> para label (text-caption, text-muted)
 *   - <span> para valor (text-h2, text)
 *   - <span> para ícone wrapper
 *
 * Server Component — zero JS no client.
 *
 * Tokens: text-caption/text-h2/text-muted/text
 */
export const StatTile = forwardRef<HTMLDivElement, StatTileProps>(function StatTile(
  { label, value, icon, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-card border border-border-subtle rounded-card p-5',
        'flex items-center justify-between gap-4',
        className,
      )}
      {...rest}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-caption text-text-muted uppercase tracking-wide">
          {label}
        </span>
        <span className="text-h2 text-text font-semibold truncate">
          {value}
        </span>
      </div>
      {icon && (
        <span className="text-text-muted shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
    </div>
  );
});