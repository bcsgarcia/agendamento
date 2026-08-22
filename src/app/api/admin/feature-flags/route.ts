// Server action pra salvar feature flags via form (sem JS no client)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const form = await req.formData();

  let flagChanged: { nome: string; ativo: boolean } | null = null;

  for (const [key, value] of form.entries()) {
    if (key.startsWith('toggle_')) {
      const nome = key.replace('toggle_', '');
      const novoValor = value.toString() === 'on';
      flagChanged = { nome, ativo: novoValor };
      break;
    }
  }

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

  // Redirect com path relativo (resolve pro dominio atual do request, sem localhost)
  const baseUrl = process.env.APP_URL || req.headers.get('origin') || new URL(req.url).origin;
  return NextResponse.redirect(
    new URL('/admin/feature-flags', baseUrl),
    { status: 303 }
  );
}
