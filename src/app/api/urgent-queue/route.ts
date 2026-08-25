// API: enfileira urgência (POST) e lista filtrada por aba (GET).
// Tab padrão 'pendentes' mantém compat com a integração Fluxi (PR #15).
//
// HOOK DE NOTIFICAÇÃO (PR #40, 2026-08-25):
//   Após criar urgência no POST, dispara Web Push pra todos os admins
//   que tenham subscription ativa. Se as chaves VAPID não estiverem
//   configuradas, vira no-op (lib/push.ts trata isso com warning).
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { notifyUrgenciaAsync } from '@/lib/push';

const Body = z.object({
  customerPhone: z.string().optional(),
  reason: z.string().min(1),
  contextSnapshot: z.string().min(1)
});

// Whitelist de tabs válidas. 'todos' = união das 3 (debug/admin).
const TAB_WHERE: Record<string, object> = {
  pendentes: { resolvedAt: null, archivedAt: null },
  concluidos: { resolvedAt: { not: null }, archivedAt: null },
  arquivados: { archivedAt: { not: null } },
  todos: {},
};

function resolveTab(raw: string | null): keyof typeof TAB_WHERE {
  if (raw && raw in TAB_WHERE) return raw as keyof typeof TAB_WHERE;
  return 'pendentes';
}

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    let customerId: string | undefined;
    if (data.customerPhone) {
      const customer = await prisma.customer.upsert({
        where: { phone: data.customerPhone },
        update: {},
        create: { phone: data.customerPhone }
      });
      customerId = customer.id;
    }
    const urgent = await prisma.urgentQueue.create({
      data: { customerId, reason: data.reason, contextSnapshot: data.contextSnapshot }
    });

    // Dispara Web Push pra todos admins com subscription ativa.
    // Fire-and-forget: não bloqueia resposta HTTP (POST continua rápido
    // mesmo se push demorar). Erros são logados dentro de notifyUrgenciaAsync.
    notifyUrgenciaAsync(urgent.reason, urgent.contextSnapshot);

    return NextResponse.json(urgent);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const tab = resolveTab(req.nextUrl.searchParams.get('tab'));
  // Concluídos: limita histórico recente (últimos 30 dias) pra evitar explosão da query.
  // Pendentes/Arquivados: lista inteira (cards raros).
  const orderBy = tab === 'concluidos'
    ? [{ resolvedAt: 'desc' as const }]
    : [{ createdAt: 'desc' as const }];

  const where = tab === 'concluidos'
    ? {
        ...TAB_WHERE.concluidos,
        resolvedAt: { not: null, gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }
    : TAB_WHERE[tab];

  const [items, counts] = await Promise.all([
    prisma.urgentQueue.findMany({ where, orderBy }),
    // Contadores independentes por aba (sempre totais, sem filtro de data).
    Promise.all([
      prisma.urgentQueue.count({ where: TAB_WHERE.pendentes }),
      prisma.urgentQueue.count({ where: TAB_WHERE.concluidos }),
      prisma.urgentQueue.count({ where: TAB_WHERE.arquivados }),
    ]),
  ]);

  return NextResponse.json({
    tab,
    items,
    counts: {
      pendentes: counts[0],
      concluidos: counts[1],
      arquivados: counts[2],
    },
  });
}
