// /api/admin/inscricoes/[id] — editar (PATCH) e remover (DELETE) uma inscrição
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InscricaoUpdateSchema, parseJsonBody } from '@/lib/course-schemas';
import { recalcAulaVagas } from '@/lib/course-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const parsed = await parseJsonBody(req, InscricaoUpdateSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Pega aulaId antes pra recalcular vagas depois
  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    select: { aulaId: true },
  });
  if (!inscricao) {
    return NextResponse.json({ error: 'inscrição não encontrada' }, { status: 404 });
  }

  // Auto-fill dataSinal/dataPagamentoFinal conforme mudança de status
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.statusPagamento === 'sinal_pago' && data.sinalPago === undefined) {
    data.sinalPago = true;
  }
  if (data.statusPagamento === 'sinal_pago' && data.dataSinal === undefined) {
    data.dataSinal = new Date().toISOString();
  }
  if (data.statusPagamento === 'quitado' && data.dataPagamentoFinal === undefined) {
    data.dataPagamentoFinal = new Date().toISOString();
  }
  // Converte string -> Date em campos de data
  for (const k of ['dataSinal', 'dataPagamentoFinal']) {
    if (k in data && typeof data[k] === 'string') {
      data[k] = new Date(data[k] as string);
    }
  }
  // Remove chaves undefined
  for (const k of Object.keys(data)) {
    if (data[k] === undefined) delete data[k];
  }

  try {
    const updated = await prisma.inscricao.update({ where: { id }, data });
    const recalc = await recalcAulaVagas(inscricao.aulaId);
    return NextResponse.json({ inscricao: updated, aula: { vagasOcupadas: recalc.vagasOcupadas, status: recalc.status } });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'inscrição não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE = hard delete (remove da contagem de vagas).
export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  // Pega aulaId antes de deletar
  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    select: { aulaId: true },
  });
  if (!inscricao) {
    return NextResponse.json({ error: 'inscrição não encontrada' }, { status: 404 });
  }

  try {
    await prisma.inscricao.delete({ where: { id } });
    const recalc = await recalcAulaVagas(inscricao.aulaId);
    return NextResponse.json({ ok: true, id, aula: { vagasOcupadas: recalc.vagasOcupadas, status: recalc.status } });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'inscrição não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}