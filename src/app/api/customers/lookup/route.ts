// API: CRM lookup por telefone (cria se não existir — upsert)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone obrigatório' }, { status: 400 });
  try {
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { phone } });
    }
    const recentBookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: { service: true },
      orderBy: { startsAt: 'desc' },
      take: 5
    });
    return NextResponse.json({ ...customer, recentBookings });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
