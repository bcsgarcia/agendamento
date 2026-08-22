export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Verifica se um número está na whitelist (retorna true/false)
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: 'phone obrigatório', allowed: false }, { status: 400 });
  }
  try {
    const normalized = phone.replace(/\D/g, '');
    const entry = await prisma.whitelist.findFirst({
      where: {
        OR: [{ phone: normalized }, { phone: phone.replace(/^\+/, '') }]
      }
    });
    return NextResponse.json({ allowed: !!entry, phone: normalized });
  } catch (e) {
    return NextResponse.json({ error: String(e), allowed: false }, { status: 500 });
  }
}

// Adiciona ou atualiza um número na whitelist
const Body = z.object({
  phone: z.string().min(8),
  name: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const normalized = data.phone.replace(/\D/g, '');
    const entry = await prisma.whitelist.upsert({
      where: { phone: normalized },
      update: { name: data.name, notes: data.notes, active: true },
      create: { phone: normalized, name: data.name, notes: data.notes, active: true }
    });
    return NextResponse.json(entry);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Lista todos os números (admin)
export async function PUT() {
  const entries = await prisma.whitelist.findMany({ orderBy: { criadoEm: 'desc' } });
  return NextResponse.json(entries);
}
