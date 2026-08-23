// /api/admin/cursos — listar (GET) e criar (POST)
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { CourseCreateSchema, parseJsonBody } from '@/lib/course-schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get('includeInactive') === '1';
    const courses = await prisma.course.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { aulas: true } },
      },
    });
    return NextResponse.json(courses);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Helper: ajusta paymentTerms null → Prisma.JsonNull. Campos opcionais undefined são omitidos.
function normalizeCourseInput<T extends Record<string, unknown>>(data: T): Prisma.CourseCreateInput {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (k === 'paymentTerms' && v === null) {
      out[k] = Prisma.JsonNull;
    } else {
      out[k] = v;
    }
  }
  return out as unknown as Prisma.CourseCreateInput;
}

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, CourseCreateSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data = normalizeCourseInput(parsed.data);

  try {
    const created = await prisma.course.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return NextResponse.json({ error: `slug "${parsed.data.slug}" já existe` }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}