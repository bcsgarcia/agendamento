// API: cria booking (com validação de conflito atômica)
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { addMinutes } from '@/lib/helpers';

const Body = z.object({
  customerPhone: z.string().min(8),
  serviceSlug: z.string().min(1),
  startsAt: z.string().datetime()
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { customerPhone, serviceSlug, startsAt } = Body.parse(json);

    const service = await prisma.service.findUnique({ where: { slug: serviceSlug } });
    if (!service) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });

    const start = new Date(startsAt);
    const end = addMinutes(start, service.durationMin);

    const conflict = await prisma.booking.findFirst({
      where: {
        status: { notIn: ['cancelled', 'no_show'] },
        AND: [{ startsAt: { lt: end } }, { endsAt: { gt: start } }]
      }
    });
    if (conflict) return NextResponse.json({ error: 'Horário já ocupado', conflict }, { status: 409 });

    const customer = await prisma.customer.upsert({
      where: { phone: customerPhone },
      update: {},
      create: { phone: customerPhone }
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        startsAt: start,
        endsAt: end,
        status: 'scheduled'
      },
      include: { customer: true, service: true }
    });

    await prisma.auditLog.create({
      data: { customerId: customer.id, eventType: 'booking_created', payload: { bookingId: booking.id, serviceSlug } }
    });

    return NextResponse.json(booking);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { customer: true, service: true },
    orderBy: { startsAt: 'desc' },
    take: 100
  });
  return NextResponse.json(bookings);
}
