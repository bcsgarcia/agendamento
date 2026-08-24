// Logo "Madame Lash" — asset oficial enviado por Bruno em 2026-08-24.
// Arquivo: public/logo-madame-lash.jpg (1775x1775, JPEG, fundo branco)
//
// Substitui a versão SVG inline (gradiente improvisado) que existia antes do logo real ser enviado.
// Quando o asset for atualizado, basta substituir public/logo-madame-lash.jpg.

import Image from 'next/image';
import { cn } from '@/components/ui/cn';

export interface MadameLogoProps {
  /** Largura em px (default 132 — mesmo tamanho que o logo anterior no AdminShell). */
  width?: number;
  /** Altura em px (default 40). */
  height?: number;
  /** Classes adicionais pro <Image>. */
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
    <Image
      src="/logo-madame-lash.jpg"
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('select-none', className)}
    />
  );
}
