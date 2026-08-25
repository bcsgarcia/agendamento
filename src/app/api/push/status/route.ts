// /api/push/status — informa se o user logado tem subscription ativa.
// Útil pra UI decidir se mostra o banner de permissão de push.
//
// Auth: getCurrentUser() obrigatório.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const count = await prisma.pushSubscription.count({
    where: { userId: user.id, ativo: true },
  });

  return NextResponse.json({
    subscribed: count > 0,
    activeCount: count,
  });
}
