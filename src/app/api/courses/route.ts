// API: lista de cursos
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const modality = req.nextUrl.searchParams.get('modality');
  try {
    const courses = await prisma.course.findMany({
      where: { active: true, ...(modality ? { modality } : {}) },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(courses);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
