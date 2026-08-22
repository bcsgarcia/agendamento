// API: slots disponíveis para um serviço num intervalo de datas
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSlots } from '@/lib/helpers';

const WORK_HOURS = { start: 9, end: 19 }; // 9h às 19h (padrão clínica estética)
const SLOT_INTERVAL = 30;

export async function GET(req: NextRequest) {
  const serviceSlug = req.nextUrl.searchParams.get('serviceSlug');
  const fromStr = req.nextUrl.searchParams.get('from') || new Date().toISOString();
  const toStr = req.nextUrl.searchParams.get('to') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  if (!serviceSlug) return NextResponse.json({ error: 'serviceSlug obrigatório' }, { status: 400 });

  try {
    const service = await prisma.service.findUnique({ where: { slug: serviceSlug } });
    if (!service) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });

    const from = new Date(fromStr);
    const to = new Date(toStr);
    const existingBookings = await prisma.booking.findMany({
      where: { startsAt: { gte: from, lte: to }, status: { notIn: ['cancelled', 'no_show'] } },
      select: { startsAt: true, endsAt: true }
    });

    const busy = new Set<string>();
    for (const b of existingBookings) {
      busy.add(`${b.startsAt.toISOString()}|${b.endsAt.toISOString()}`);
    }

    const slots: { startsAt: string; endsAt: string }[] = [];
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      if (day.getDay() === 0) continue; // pula domingo
      const dayStart = new Date(day); dayStart.setHours(WORK_HOURS.start, 0, 0, 0);
      const dayEnd = new Date(day); dayEnd.setHours(WORK_HOURS.end, 0, 0, 0);
      for (const slotStart of generateSlots(dayStart, dayEnd, service.durationMin, SLOT_INTERVAL)) {
        const slotEnd = new Date(slotStart.getTime() + service.durationMin * 60000);
        const key = `${slotStart.toISOString()}|${slotEnd.toISOString()}`;
        if (busy.has(key)) continue;
        // também checa sobreposição real
        const overlap = existingBookings.some(b => slotStart < b.endsAt && slotEnd > b.startsAt);
        if (overlap) continue;
        slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
      }
    }
    return NextResponse.json({ service, slots });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
