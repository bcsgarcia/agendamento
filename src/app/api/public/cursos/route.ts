// /api/public/cursos — listagem pública de cursos ativos (sem auth, sem paymentTerms)
// Pensado pra RAG do Fluxi e embed futuro em sites.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    const where = {
      active: true,
      ...(slug ? { slug } : {}),
    };

    const courses = await prisma.course.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        modality: true,
        description: true,
        priceCents: true,
        durationMin: true,
        cargaHorariaHoras: true,
        maxAlunos: true,
        formaPagamento: true,
        purchaseUrl: true,
        aulas: {
          where: {
            status: { in: ['aberta', 'lotada'] },
            dataFim: { gte: new Date() },
          },
          orderBy: { dataInicio: 'asc' },
          select: {
            id: true,
            dataInicio: true,
            dataFim: true,
            vagasOcupadas: true,
            status: true,
            local: true,
          },
        },
      },
    });

    return NextResponse.json({
      count: courses.length,
      courses: courses.map((c) => ({
        ...c,
        aulas: c.aulas.map((a) => ({
          ...a,
          vagasDisponiveis: c.maxAlunos != null ? Math.max(0, c.maxAlunos - a.vagasOcupadas) : null,
        })),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}