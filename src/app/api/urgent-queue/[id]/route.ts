// /api/urgent-queue/[id] — PATCH (resolve/archive/unresolve/unarchive/update_note) e DELETE (físico).
// Auth: exige sessão válida (getCurrentUser). Sem checagem de role (Bruno: "qualquer role").
// Nota: middleware NÃO cobre /api/urgent-queue/* (só /api/admin/*), então validamos manualmente.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PatchBody = z.discriminatedUnion('action', [
  z.object({ action: z.literal('resolve'), note: z.string().max(500).optional() }),
  z.object({ action: z.literal('unresolve') }),
  z.object({ action: z.literal('archive') }),
  z.object({ action: z.literal('unarchive') }),
  z.object({ action: z.literal('update_note'), note: z.string().max(500) }),
]);

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let parsed;
  try {
    parsed = PatchBody.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  let data: Record<string, unknown>;
  switch (parsed.action) {
    case 'resolve':
      data = { resolvedAt: new Date(), resolvedBy: user.id, resolvedNote: parsed.note ?? null };
      break;
    case 'unresolve':
      data = { resolvedAt: null, resolvedBy: null };
      break;
    case 'archive':
      data = { archivedAt: new Date(), archivedBy: user.id };
      break;
    case 'unarchive':
      data = { archivedAt: null, archivedBy: null };
      break;
    case 'update_note':
      data = { resolvedNote: parsed.note };
      break;
  }

  try {
    const updated = await prisma.urgentQueue.update({
      where: { id: ctx.params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'urgência não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    await prisma.urgentQueue.delete({ where: { id: ctx.params.id } });
    return NextResponse.json({ ok: true, id: ctx.params.id });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'urgência não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
