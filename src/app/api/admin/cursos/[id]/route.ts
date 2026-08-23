// /api/admin/cursos/[id] — detalhe, editar, soft-delete
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { CourseUpdateSchema, parseJsonBody } from '@/lib/course-schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper: ajusta paymentTerms null → Prisma.JsonNull; se a chave não está presente (undefined),
// remove-a do objeto pra o Prisma não atualizar o campo.
function normalizeCourseInput<T extends Record<string, unknown>>(data: T): Prisma.CourseUpdateInput {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue; // não atualiza campo não enviado
    if (k === 'paymentTerms' && v === null) {
      out[k] = Prisma.JsonNull;
    } else {
      out[k] = v;
    }
  }
  return out as unknown as Prisma.CourseUpdateInput;
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        aulas: {
          orderBy: { dataInicio: 'asc' },
          include: {
            _count: { select: { inscricoes: true } },
          },
        },
      },
    });
    if (!course) {
      return NextResponse.json({ error: 'curso não encontrado' }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const parsed = await parseJsonBody(req, CourseUpdateSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const data = normalizeCourseInput(parsed.data);

  try {
    const updated = await prisma.course.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'curso não encontrado' }, { status: 404 });
    }
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return NextResponse.json({ error: 'slug já existe em outro curso' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE = soft delete (active=false) — preserva histórico de aulas/inscrições.
export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  try {
    const updated = await prisma.course.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ ok: true, id: updated.id, active: updated.active });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'curso não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}