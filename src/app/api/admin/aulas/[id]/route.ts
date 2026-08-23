// /api/admin/aulas/[id] — editar (PATCH) e cancelar (DELETE) uma aula
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AulaUpdateSchema, parseJsonBody } from '@/lib/course-schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const parsed = await parseJsonBody(req, AulaUpdateSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Converte string ISO -> Date apenas para campos enviados
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    if (k === 'dataInicio' || k === 'dataFim') {
      data[k] = new Date(v as string);
    } else {
      data[k] = v;
    }
  }

  try {
    const updated = await prisma.aula.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'aula não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE = cancelar (soft, status='cancelada'). Inscrições existentes são preservadas (audit).
export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  try {
    const updated = await prisma.aula.update({
      where: { id },
      data: { status: 'cancelada' },
    });
    return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'aula não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}