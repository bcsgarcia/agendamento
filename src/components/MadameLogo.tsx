// Logo "Madame Lash" — asset oficial enviado por Bruno em 2026-08-24 (atualizado 18:28).
//
// 2 versões em public/:
//   - logo-madame-lash-light.png — chapéu BRANCO + "LASHES" BRANCO (pro light mode)
//   - logo-madame-lash-dark.png  — chapéu PRETO  + "LASHES" PRETO  (pro dark mode)
//
// A visibilidade é controlada por CSS (classe .dark no <html>, Tailwind darkMode: 'class'):
//   .light-mode só mostra a versão light
//   .dark-mode só mostra a versão dark
//
// Renderiza as 2 empilhadas no mesmo lugar; CSS troca visibilidade. Sem JS extra,
// sem flash entre temas — a classe .dark é aplicada no <html> antes do React hidratar
// (ver src/app/layout.tsx → themeInitScript).

import Image from 'next/image';
import { cn } from '@/components/ui/cn';

export interface MadameLogoProps {
  /** Largura em px (default 132 — mesmo tamanho que o logo anterior no AdminShell). */
  width?: number;
  /** Altura em px (default 40). */
  height?: number;
  /** Classes adicionais pro wrapper. */
  className?: string;
  /** Texto alternativo para leitores de tela. */
  alt?: string;
  /** Prioridade no carregamento (LCP) — usar quando é o elemento principal visível. */
  priority?: boolean;
}

export function MadameLogo({
  width = 132,
  height = 40,
  className,
  alt = 'Madame Lash — Administração',
  priority = false,
}: MadameLogoProps) {
  return (
    <span
      className={cn('inline-block relative select-none', className)}
      style={{ width, height }}
      aria-label={alt}
      role="img"
    >
      {/* Light mode — chapéu branco, "LASHES" branco */}
      <Image
        src="/logo-madame-lash-light.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden="true"
        className="block dark:hidden select-none"
        style={{ width, height }}
      />
      {/* Dark mode — chapéu preto, "LASHES" preto */}
      <Image
        src="/logo-madame-lash-dark.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden="true"
        className="hidden dark:block select-none"
        style={{ width, height }}
      />
    </span>
  );
}
