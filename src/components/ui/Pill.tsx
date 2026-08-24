'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export type PillVariant = 'active' | 'inactive';

export interface PillProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: PillVariant;
  /** Ícone opcional renderizado à esquerda do texto. */
  icon?: ReactNode;
}

/**
 * Pílula fully-rounded (radius-pill) para tags, filtros e status badges.
 *
 * - `active`: gradient accent-bg → accent-bg-2, texto branco.
 * - `inactive`: bg pill-inactive, texto muted.
 *
 * Quando `onClick` é fornecido, renderiza <button>. Caso contrário,
 * renderiza <span> (uso decorativo em listas estáticas).
 *
 * Tokens: bg/accent-bg/accent-bg-2/pill-inactive/text/text-muted
 */
export const Pill = forwardRef<HTMLButtonElement, PillProps>(function Pill(
  { variant = 'inactive', icon, className, children, onClick, ...rest },
  ref,
) {
  const interactive = typeof onClick === 'function';

  const baseClasses = cn(
    'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-pill text-label',
    'transition-colors duration-150',
    'select-none whitespace-nowrap max-w-full truncate',
    variant === 'active' && 'text-white bg-gradient-to-r from-accent-bg to-accent-bg-2',
    variant === 'inactive' && 'bg-pill-inactive text-text-muted',
    interactive && 'cursor-pointer hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
    !interactive && 'cursor-default',
    className,
  );

  if (!interactive) {
    return (
      <span className={baseClasses}>
        {icon}
        {children}
      </span>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={baseClasses}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});