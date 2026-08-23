import clsx, { type ClassValue } from 'clsx';

/**
 * Utility para combinar classes CSS condicionalmente.
 * Wrapper sobre clsx — TypeScript estrito aceita qualquer ClassValue.
 *
 * Uso:
 *   <div className={cn('base-class', isActive && 'active-class', className)} />
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}