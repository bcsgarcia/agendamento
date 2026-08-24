// Logo "Madame Lash" — fallback SVG enquanto Bruno envia o asset oficial.
//
// O componente:
//   - Server Component (zero JS no client)
//   - Aceita `width`/`height`/`className` pra controlar tamanho/posicionamento
//   - Quando Bruno enviar o PNG/SVG oficial em public/logo-madame-lash.{ext},
//     trocar o conteúdo pelo <Image src="/logo-madame-lash.ext" /> em ~5min.
//
// SVG inline: gradiente "Madame" do logo (rosa claro → coral → rosê), texto "MADAME LASH"
// estilizado em serif. Para todos os temas: gradiente fixo (rosa), texto chapéu em cinza-chumbo.

import { useId } from 'react';
import { cn } from '@/components/ui/cn';

export interface MadameLogoProps {
  /** Largura em px (default 132 — mesmo tamanho que "Aline Estética" no AdminShell). */
  width?: number;
  /** Altura em px (default 40). */
  height?: number;
  /** Classes adicionais pro <svg>. */
  className?: string;
  /** Texto alternativo para leitores de tela. */
  alt?: string;
}

export function MadameLogo({
  width = 132,
  height = 40,
  className,
  alt = 'Madame Lash — Administração',
}: MadameLogoProps) {
  // useId() gera IDs únicos por instância tanto em SSR quanto client.
  // CRÍTICO: AdminShell renderiza DUAS instâncias do MadameLogo (mobile drawer
  // + desktop sidebar). Se compartilharem o mesmo id do <linearGradient>, o
  // browser ignora o segundo e os <text> com fill="url(#x)" podem referenciar
  // o gradient errado OU o fill resolver pra nada — fazendo o "Madame"
  // desaparecer do logo. Sintoma observado em Playwright headless: "Madame"
  // some, "LASHES" (fill=currentColor) permanece.
  const rawId = useId();
  const id = `madame-gradient-${rawId.replace(/:/g, '')}`;
  return (
    <svg
      role="img"
      aria-label={alt}
      width={width}
      height={height}
      viewBox="0 0 220 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('select-none', className)}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F6C4BC" />
          <stop offset="50%" stopColor="#E8917E" />
          <stop offset="100%" stopColor="#C97C6E" />
        </linearGradient>
      </defs>

      {/* Texto "MADAME" — serif italic, com gradiente Madame.
          font-family começa com Liberation Serif porque é métrica-compatível
          com Times/Georgia e está disponível em qualquer ambiente (incluindo
          containers Docker/Chromium headless). Sem isso, Chromium headless
          falha em renderizar o glifo e o "Madame" desaparece do logo. */}
      <text
        x="0"
        y="30"
        fontFamily="'Liberation Serif', Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="26"
        fill={`url(#${id})`}
        letterSpacing="0.5"
      >
        Madame
      </text>

      {/* Texto "LASHES" — cinza-chumbo, sans-serif bold, todo maiúsculo.
          Mesmo rationale: Liberation Sans é métrica-compatível com Arial/Helvetica. */}
      <text
        x="0"
        y="52"
        fontFamily="'Liberation Sans', Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="14"
        fill="currentColor"
        letterSpacing="3"
        className="fill-text"
      >
        LASHES
      </text>

      {/* Pequeno detalhe decorativo — traço fino coral */}
      <line
        x1="105"
        y1="44"
        x2="125"
        y2="44"
        stroke="#C97C6E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}