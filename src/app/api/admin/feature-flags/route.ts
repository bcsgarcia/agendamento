// Server action pra salvar feature flags via form (sem JS no client)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function getBaseUrl(req: NextRequest): string {
  return (
    process.env.APP_URL ||
    req.headers.get('origin') ||
    (req.headers.get('x-forwarded-proto') && req.headers.get('host')
      ? `${req.headers.get('x-forwarded-proto')}://${req.headers.get('host')}`
      : null) ||
    new URL(req.url).origin
  );
}

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

  const baseUrl = getBaseUrl(req);
  return NextResponse.redirect(new URL('/admin/feature-flags', baseUrl), { status: 303 });
}
