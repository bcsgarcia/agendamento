export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Endpoint PÚBLICO (sem auth) pro Fluxi consultar
// Cache curto (5s) pra evitar bater no DB toda chamada
let _cache: { data: Record<string, boolean>; ts: number } | null = null;
const CACHE_TTL_MS = 5_000;

async function loadFlags(): Promise<Record<string, boolean>> {
  const now = Date.now();
  if (_cache && (now - _cache.ts) < CACHE_TTL_MS) return _cache.data;

  const rows = await prisma.featureFlag.findMany();
  const map: Record<string, boolean> = {};
  for (const r of rows) {
    map[r.nome] = r.ativo;
  }
  _cache = { data: map, ts: now };
  return map;
}

// GET /api/feature-flags/:nome? — lê 1 flag (uso do Fluxi)
export async function GET(req: NextRequest) {
  const nome = req.nextUrl.pathname.split('/').pop();
  if (!nome) {
    return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 });
  }
  try {
    const flags = await loadFlags();
    const ativo = flags[nome] ?? false;
    return NextResponse.json({ nome, ativo });
  } catch (e) {
    // Fail-safe: em erro, retorna false (whitelist desabilitada)
    return NextResponse.json({ nome, ativo: false, error: String(e) });
  }
}

// POST /api/feature-flags/sync? — força reload do cache (uso do admin)
export async function POST() {
  _cache = null;
  return NextResponse.json({ ok: true });
}

// PUT /api/feature-flags (uso do admin: bulk upsert)
const Body = z.object({
  flags: z.array(z.object({
    nome: z.string().min(1),
    ativo: z.boolean(),
    descricao: z.string().optional()
  }))
});

export async function PUT(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    for (const f of data.flags) {
      await prisma.featureFlag.upsert({
        where: { nome: f.nome },
        update: { ativo: f.ativo, descricao: f.descricao },
        create: { nome: f.nome, ativo: f.ativo, descricao: f.descricao }
      });
    }
    _cache = null;
    return NextResponse.json({ ok: true, updated: data.flags.length });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
