// /api/push/subscribe — salva (ou reativa) uma subscription Web Push do user logado.
//
// POST { subscription: PushSubscriptionJSON } → cria/reativa
// DELETE { endpoint: string }                 → desativa subscription
//
// Auth: getCurrentUser() obrigatório. Sem user → 401.
//
// Idempotente: se já existe subscription com mesmo endpoint, só atualiza
// userId e reativa (caso o user tenha desinstalado o SW antes e reinstalado
// em outra sessão).
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SubscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const UnsubscribeBody = z.object({
  endpoint: z.string().url(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let parsed;
  try {
    parsed = SubscribeBody.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: e.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  const { endpoint, keys } = parsed;

  // Validação leve do tamanho (Chrome manda ~87 chars de p256dh; Firefox ~88).
  if (keys.p256dh.length < 80 || keys.p256dh.length > 200) {
    return NextResponse.json(
      { error: 'p256dh inválido (tamanho fora do esperado)' },
      { status: 400 },
    );
  }
  if (keys.auth.length < 16 || keys.auth.length > 50) {
    return NextResponse.json(
      { error: 'auth inválido (tamanho fora do esperado)' },
      { status: 400 },
    );
  }

  try {
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        ativo: true,
      },
      update: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        ativo: true,
      },
    });
    return NextResponse.json({ ok: true, id: sub.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let parsed;
  try {
    parsed = UnsubscribeBody.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: e.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  try {
    // Só desativa se a subscription for do próprio user (segurança).
    await prisma.pushSubscription.updateMany({
      where: { endpoint: parsed.endpoint, userId: user.id },
      data: { ativo: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
