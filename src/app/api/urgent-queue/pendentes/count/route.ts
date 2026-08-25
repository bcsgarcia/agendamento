// /api/urgent-queue/pendentes/count — endpoint LEVE pro polling in-page.
//
// Retorna { count, ultima_criada_em } onde:
//   - count = total de urgências pendentes (resolvedAt IS NULL AND archivedAt IS NULL)
//   - ultima_criada_em = ISO string da mais recente, ou null se vazio
//
// Polling client usa `ultima_criada_em` pra detectar "nova urgência"
// (se valor mudou desde o último poll, dispara banner).
//
// Auth: getCurrentUser() — só admins logados veem o badge.
// (Middleware não cobre /api/urgent-queue/* — validamos manualmente.)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Count + mais recente num round-trip só (aggregate não suporta orderBy,
  // mas findFirst + count em paralelo é ~o mesmo).
  const [count, latest] = await Promise.all([
    prisma.urgentQueue.count({
      where: { resolvedAt: null, archivedAt: null },
    }),
    prisma.urgentQueue.findFirst({
      where: { resolvedAt: null, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  return NextResponse.json({
    count,
    ultima_criada_em: latest?.createdAt?.toISOString() ?? null,
  });
}
