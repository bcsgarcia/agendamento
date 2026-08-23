import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Conteúdo do card. */
  children: ReactNode;
}

/**
 * Wrapper de superfície para agrupar conteúdo em painéis.
 *
 * - bg `card` (#1E1C2A), border `border-subtle`, radius `card` (16px).
 * - Padding padrão `p-5` (override via className).
 * - Server Component — zero JS no client.
 *
 * Tokens: card/border-subtle
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-card border border-border-subtle rounded-card p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});