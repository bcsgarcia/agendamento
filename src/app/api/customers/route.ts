// API: cria cliente explicitamente (POST). Retorna 409 se já existe por telefone.
//
// Substitui o comportamento de upsert implícito do antigo GET /lookup.
// Fluxo esperado pelo agente Andy:
//   1) GET /api/customers/lookup?phone=X  → 200 (existe) ou 404 (não existe)
//   2) Se 404: POST /api/customers { phone, name } → 201 (criado) ou 409 (race)
//
// O 409 inclui o cliente existente no body pra Andy cair num fallback limpo.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const Body = z.object({
  phone: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());

    // Se já existe, retorna 409 com o cliente existente (race-condition safety).
    const existing = await prisma.customer.findUnique({ where: { phone: data.phone } });
    if (existing) {
      return NextResponse.json(
        { error: 'Cliente já existe', customer: existing },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        phone: data.phone,
        ...(data.name ? { name: data.name } : {}),
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
