// Logo "Madame Lash" — asset oficial enviado por Bruno em 2026-08-24.
//
// 2 versões em public/:
//   - logo-madame-lash-light.png — chapéu BRANCO + "LASHES" BRANCO
//   - logo-madame-lash-dark.png  — chapéu PRETO  + "LASHES" PRETO
//
// IMPORTANTE: a nomenclatura dos arquivos é "cor_do_chapéu", não "tema_da_tela".
// Como os PNGs têm fundo TRANSPARENTE (RGBA), o que aparece é só o chapéu + texto.
// Pra contrastar:
//   - fundo CLARO (light mode) → chapéu PRETO  (imagem dark.png)
//   - fundo ESCURO (dark mode)  → chapéu BRANCO (imagem light.png)
//
// Visibilidade controlada por classe .dark no <html> (Tailwind darkMode: 'class'):
//   .light-mode (sem .dark)  → mostra logo-madame-lash-dark.png  (chapéu preto)
//   .dark-mode  (com .dark)   → mostra logo-madame-lash-light.png (chapéu branco)
// Sem flash entre temas — classe .dark aplicada antes do React hidratar
// (ver src/app/layout.tsx → themeInitScript).
//
// Bug fix (2026-08-24 19:43): antes estava invertido — chapéu branco em fundo
// claro e chapéu preto em fundo escuro, ambos invisíveis. Invertido os src=.

import Image from 'next/image';
import { cn } from '@/components/ui/cn';

export interface MadameLogoProps {
  /** Largura em px (default 132). Altura = width * 2/3 (proporção real do asset 1536x1024). */
  width?: number;
  /** Classes adicionais pro wrapper. */
  className?: string;
  /** Texto alternativo para leitores de tela. */
  alt?: string;
  /** Prioridade no carregamento (LCP) — usar quando é o elemento principal visível. */
  priority?: boolean;
}

const ASPECT = 1024 / 1536; // ~0.667 (altura = 2/3 da largura)

export function MadameLogo({
  width = 132,
  className,
  alt = 'Madame Lash — Administração',
  priority = false,
}: MadameLogoProps) {
  const height = Math.round(width * ASPECT);
  return (
    <span
      className={cn('inline-block relative select-none', className)}
      style={{ width, height }}
      aria-label={alt}
      role="img"
    >
      {/* Light mode (fundo claro) → chapéu PRETO (image "dark" — preto pra contrastar) */}
      <Image
        src="/logo-madame-lash-dark.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden="true"
        className="block dark:hidden select-none"
        style={{ width, height }}
      />
      {/* Dark mode (fundo escuro) → chapéu BRANCO (image "light" — branco pra contrastar) */}
      <Image
        src="/logo-madame-lash-light.png"
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
