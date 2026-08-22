// Server action pra salvar feature flags via form (sem JS no client)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const form = await req.formData();

  // Quando clica num toggle, o form envia APENAS o toggle clicado.
  // Outros toggles não vêm no submit (HTML form behavior).
  // Os hidden inputs "flag[NOME]" sempre vêm, mas só servem de fallback.

  let flagChanged: { nome: string; ativo: boolean } | null = null;

  for (const [key, value] of form.entries()) {
    if (key.startsWith('toggle_')) {
      const nome = key.replace('toggle_', '');
      const novoValor = value.toString() === 'on';
      flagChanged = { nome, ativo: novoValor };
      break; // só pode ter um toggle clicado por vez
    }
  }

  // Se nenhum toggle foi clicado, usa o hidden input "flag[NOME]" como fallback
  // (caso você queira futuramente um "salvar todos" que submete todos os flags)
  if (!flagChanged) {
    for (const [key, value] of form.entries()) {
      if (key.startsWith('flag[') && key.endsWith(']')) {
        const nome = key.slice(5, -1);
        const novoValor = value.toString() === '1';
        flagChanged = { nome, ativo: novoValor };
      }
    }
  }

  if (flagChanged) {
    await prisma.featureFlag.update({
      where: { nome: flagChanged.nome },
      data: { ativo: flagChanged.ativo },
    });
  }

  // Redireciona de volta
  return NextResponse.redirect(new URL('/admin/feature-flags', req.url), { status: 303 });
}
