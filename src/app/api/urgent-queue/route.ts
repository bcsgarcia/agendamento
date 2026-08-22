// API: enfileira urgência
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const Body = z.object({
  customerPhone: z.string().optional(),
  reason: z.string().min(1),
  contextSnapshot: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    let customerId: string | undefined;
    if (data.customerPhone) {
      const customer = await prisma.customer.upsert({
        where: { phone: data.customerPhone },
        update: {},
        create: { phone: data.customerPhone }
      });
      customerId = customer.id;
    }
    const urgent = await prisma.urgentQueue.create({
      data: { customerId, reason: data.reason, contextSnapshot: data.contextSnapshot }
    });
    return NextResponse.json(urgent);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const urgent = await prisma.urgentQueue.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(urgent);
}
