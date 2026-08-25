// /api/push/vapid-public-key — retorna a chave pública VAPID pro browser.
// Endpoint PÚBLICO (precisa estar acessível antes do login pra registrar
// service worker / pedir permissão).
//
// Não exponha a chave privada — só a pública.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || '';
  if (!publicKey) {
    // 503 indica "configuração ausente" — UI mostra banner explicando.
    return NextResponse.json(
      {
        error: 'push_not_configured',
        message:
          'VAPID_PUBLIC_KEY não configurada no servidor. Adicione no Coolify antes de ativar push.',
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ publicKey });
}
