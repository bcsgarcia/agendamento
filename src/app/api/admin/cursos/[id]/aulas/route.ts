// /api/admin/cursos/[id]/aulas — listar (GET) e criar (POST) aulas de um curso
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AulaCreateSchema, parseJsonBody } from '@/lib/course-schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id: courseId } = ctx.params;
  try {
    const aulas = await prisma.aula.findMany({
      where: { courseId },
      orderBy: { dataInicio: 'asc' },
      include: {
        _count: { select: { inscricoes: true } },
      },
    });
    return NextResponse.json(aulas);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const { id: courseId } = ctx.params;
  const parsed = await parseJsonBody(req, AulaCreateSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Garante que curso existe e tá ativo
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, active: true, maxAlunos: true },
  });
  if (!course) {
    return NextResponse.json({ error: 'curso não encontrado' }, { status: 404 });
  }

  try {
    const aula = await prisma.aula.create({
      data: {
        courseId,
        dataInicio: new Date(parsed.data.dataInicio),
        dataFim: new Date(parsed.data.dataFim),
        local: parsed.data.local ?? null,
        status: parsed.data.status ?? 'aberta',
      },
    });
    return NextResponse.json(aula, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}