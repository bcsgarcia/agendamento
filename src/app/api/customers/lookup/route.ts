// API: CRM lookup por telefone (read-only).
//
// Retorna 200 com o cliente + últimas 5 marcações se existir.
// Retorna 404 se o telefone não estiver cadastrado.
//
// Fluxo Andy:
//   - 200 → usar dados existentes (nome, tags, preferências)
//   - 404 → chamar POST /api/customers com phone+name
//
// (Anteriormente este endpoint fazia upsert implícito. Foi separado em
// POST /api/customers pra evitar perder o nome fornecido pelo cliente
// durante o cadastro. PR feat/customer-create-api, 2026-08-25.)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone obrigatório' }, { status: 400 });
  try {
    const customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
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
