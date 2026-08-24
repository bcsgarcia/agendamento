'use client';

// Botão sol/lua para alternar entre Light (Madame Lash) e Dark (Dark Violet).
// Aparece no header do AdminShell, à esquerda do chip do usuário.
//
// - Usa o hook useTheme() que sincroniza localStorage + cookie + classe .dark no <html>.
// - Server-safe: o botão renderiza placeholder até o effect rodar no client (sem hydration mismatch).

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';
import { cn } from '@/components/ui/cn';

export interface ThemeToggleProps {
  /** Classes adicionais pro wrapper. */
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-pressed={isDark}
      title={isDark ? 'Tema claro (Madame Lash)' : 'Tema escuro (Dark Violet)'}
      className={cn(
        'inline-flex items-center justify-center',
        'w-9 h-9 rounded-pill shrink-0',
        'bg-card border border-border-subtle',
        'text-text-muted hover:text-text hover:bg-card-elevated',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-accent/40',
        className,
      )}
    >
      {/* Mostra o ícone do tema PARA O QUAL vamos trocar (claro se está dark, escuro se está light) */}
      {isDark ? (
        <Sun className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}