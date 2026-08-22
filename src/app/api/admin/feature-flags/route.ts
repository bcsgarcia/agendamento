// Server action pra salvar feature flags via form (sem JS no client)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  // Pega todos os campos "flag[NOME]" e "toggle_NOME"
  const updates: { nome: string; ativo: boolean }[] = [];
  const flagFields: Record<string, { novo: boolean; atual: boolean }> = {};

  // Lê flags atuais pra comparar
  const allFlags = await prisma.featureFlag.findMany();
  for (const f of allFlags) {
    flagFields[f.nome] = { novo: false, atual: f.ativo };
  }

  for (const [key, value] of form.entries()) {
    if (key.startsWith('toggle_')) {
      const nome = key.replace('toggle_', '');
      const novoValor = value.toString() === 'on';
      if (flagFields[nome]) {
        flagFields[nome].novo = novoValor;
      }
    }
  }

  // Aplica mudanças
  for (const [nome, { novo, atual }] of Object.entries(flagFields)) {
    if (novo !== atual) {
      await prisma.featureFlag.update({
        where: { nome },
        data: { ativo: novo }
      });
    }
  }

  // Redireciona de volta
  return NextResponse.redirect(new URL('/admin/feature-flags', req.url), { status: 303 });
}
