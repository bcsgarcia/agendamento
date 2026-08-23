// /api/admin/aulas/[id]/inscricoes — listar (GET) e adicionar (POST) inscritos numa aula
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InscricaoCreateSchema, parseJsonBody } from '@/lib/course-schemas';
import { recalcAulaVagas } from '@/lib/course-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id: aulaId } = ctx.params;
  try {
    const inscricoes = await prisma.inscricao.findMany({
      where: { aulaId },
      orderBy: { criadoEm: 'asc' },
    });
    return NextResponse.json(inscricoes);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const { id: aulaId } = ctx.params;
  const parsed = await parseJsonBody(req, InscricaoCreateSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Verifica aula existe e não está cancelada/concluída
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    select: { id: true, status: true, course: { select: { maxAlunos: true } } },
  });
  if (!aula) {
    return NextResponse.json({ error: 'aula não encontrada' }, { status: 404 });
  }
  if (aula.status === 'cancelada' || aula.status === 'concluida') {
    return NextResponse.json({ error: `não é possível inscrever em aula ${aula.status}` }, { status: 409 });
  }

  // Se já tem maxAlunos e vagasOcupadas >= max → lotada
  if (aula.course.maxAlunos) {
    const lotacao = await prisma.inscricao.count({
      where: { aulaId, statusPagamento: { not: 'cancelado' } },
    });
    if (lotacao >= aula.course.maxAlunos) {
      return NextResponse.json({ error: 'aula lotada' }, { status: 409 });
    }
  }

  try {
    const inscricao = await prisma.inscricao.create({
      data: {
        aulaId,
        nomeInscrito: parsed.data.nomeInscrito,
        email: parsed.data.email ?? null,
        telefone: parsed.data.telefone ?? null,
        valorPago: parsed.data.valorPago ?? null,
        sinalPago: parsed.data.sinalPago ?? false,
        statusPagamento: parsed.data.statusPagamento ?? 'pendente',
      },
    });
    // Recalcula vagas e status da aula após criar
    const recalc = await recalcAulaVagas(aulaId);
    return NextResponse.json({ inscricao, aula: { vagasOcupadas: recalc.vagasOcupadas, status: recalc.status } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}