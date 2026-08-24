/**
 * POST /api/account/change-password
 *
 * Permite que QUALQUER usuário logado (qualquer role: dev/admin/user) troque a PRÓPRIA senha.
 *
 * Validações:
 *  - currentPassword: obrigatório; verificado via bcrypt.compare contra passwordHash atual.
 *  - newPassword: obrigatório; ≥ 8 caracteres; ≠ currentPassword.
 *  - confirmNewPassword: obrigatório; === newPassword.
 *
 * Respostas:
 *  - 200 → senha trocada, retorna { ok: true }. User continua logado (cookie não muda).
 *  - 400 → validação falhou.
 *  - 401 → sem sessão / senha atual incorreta / user não encontrado.
 *  - 405 → método errado (só POST).
 *
 * Permissões: nenhum check de role — qualquer usuário autenticado pode trocar a PRÓPRIA senha.
 * Não há caminho aqui para trocar senha de OUTRO user (isso é via /api/admin/users/[id]/reset-password).
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { currentPassword, newPassword, confirmNewPassword } = body as {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmNewPassword?: unknown;
  };

  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    typeof confirmNewPassword !== 'string'
  ) {
    return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Nova senha deve ter pelo menos 8 caracteres' },
      { status: 400 },
    );
  }

  if (newPassword !== confirmNewPassword) {
    return NextResponse.json(
      { error: 'Nova senha e confirmação não batem' },
      { status: 400 },
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: 'Nova senha deve ser diferente da atual' },
      { status: 400 },
    );
  }

  // Buscar user + verificar senha atual.
  const user = await prisma.user.findUnique({ where: { id: actor.id } });
  if (!user || !user.ativo) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}

// Qualquer método diferente de POST → 405.
export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}