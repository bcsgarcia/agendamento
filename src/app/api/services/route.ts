// API: lista de serviços + busca por slug
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  const q = req.nextUrl.searchParams.get('q');
  try {
    if (slug) {
      const service = await prisma.service.findUnique({ where: { slug } });
      if (!service || !service.active) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
      return NextResponse.json(service);
    }
    const services = await prisma.service.findMany({
      where: {
        active: true,
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {})
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(services);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
