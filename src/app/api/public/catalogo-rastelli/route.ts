// /api/public/catalogo-rastelli — endpoint público (com API key) que retorna o
// catálogo consolidado das formações Rastelli em formato markdown plain text.
// Consumido pela ferramenta `buscar_catalogo_rastelli` do Fluxi (Andy).
//
// Auth: header `X-Catalog-Key` deve bater com a env var `CATALOGO_API_KEY`
// do agendamento. Fail-closed: se a env var não estiver configurada, retorna
// 503 (NÃO expõe dados).
import { NextRequest, NextResponse } from 'next/server';
import { gerarCatalogoRastelliTexto } from '@/lib/catalogo-rastelli';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  // Fail-closed: se a env var não está configurada, não expõe.
  const expectedKey = process.env.CATALOGO_API_KEY;
  if (!expectedKey || expectedKey.length < 16) {
    return NextResponse.json(
      {
        error: 'Endpoint não configurado. Defina CATALOGO_API_KEY no servidor.',
      },
      { status: 503 },
    );
  }

  const providedKey = req.headers.get('x-catalog-key');
  if (!providedKey || providedKey !== expectedKey) {
    return NextResponse.json(
      { error: 'API key inválida ou ausente.' },
      { status: 401 },
    );
  }

  try {
    const url = new URL(req.url);
    const filtro = url.searchParams.get('filtro') || null;

    const result = await gerarCatalogoRastelliTexto({ filtro });

    return NextResponse.json(result, {
      headers: {
        // Sem cache — o Fluxi já tem TTL interno (60s).
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Erro ao gerar catálogo: ${String(e)}` },
      { status: 500 },
    );
  }
}
