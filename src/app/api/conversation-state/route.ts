// API: estado de conversa por cliente
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get('customerId');
  const customerPhone = req.nextUrl.searchParams.get('customerPhone');
  if (!customerId && !customerPhone) return NextResponse.json({ error: 'customerId ou customerPhone obrigatório' }, { status: 400 });
  try {
    const where = customerId ? { customerId } : { customer: { phone: customerPhone! } };
    const state = await prisma.conversationState.findFirst({ where, include: { customer: true } });
    if (!state) return NextResponse.json({ state: 'bot_ativo', message: 'sem estado persistido (default)' });
    return NextResponse.json(state);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

const Body = z.object({
  customerPhone: z.string(),
  state: z.enum(['bot_ativo', 'humano_ativo', 'aguardando_humano', 'encerrado']),
  contextSummary: z.string().optional(),
  lastClientMsgAt: z.string().datetime().optional(),
  lastHumanMsgAt: z.string().datetime().optional(),
  lastBotMsgAt: z.string().datetime().optional()
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = Body.parse(json);
    const customer = await prisma.customer.upsert({
      where: { phone: data.customerPhone },
      update: {},
      create: { phone: data.customerPhone }
    });
    const state = await prisma.conversationState.upsert({
      where: { customerId: customer.id },
      update: {
        state: data.state,
        contextSummary: data.contextSummary,
        lastClientMsgAt: data.lastClientMsgAt ? new Date(data.lastClientMsgAt) : undefined,
        lastHumanMsgAt: data.lastHumanMsgAt ? new Date(data.lastHumanMsgAt) : undefined,
        lastBotMsgAt: data.lastBotMsgAt ? new Date(data.lastBotMsgAt) : undefined
      },
      create: {
        customerId: customer.id,
        state: data.state,
        contextSummary: data.contextSummary,
        lastClientMsgAt: data.lastClientMsgAt ? new Date(data.lastClientMsgAt) : undefined,
        lastHumanMsgAt: data.lastHumanMsgAt ? new Date(data.lastHumanMsgAt) : undefined,
        lastBotMsgAt: data.lastBotMsgAt ? new Date(data.lastBotMsgAt) : undefined
      }
    });
    return NextResponse.json(state);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
