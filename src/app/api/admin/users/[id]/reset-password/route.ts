import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  canManageUsers,
  canResetPassword,
  generatePassword,
  type Role,
} from '@/lib/permissions';
import {
  findUserOr404,
  json401,
  json403,
  requireActor,
} from '@/lib/adminUsersApi';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/admin/users/[id]/reset-password
 * Gera nova senha aleatória de 8 dígitos; retorna { generatedPassword } UMA VEZ.
 * Permissão: dev, admin (com canResetPassword).
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const actor = await requireActor();
  if (!actor) return json401();
  if (!canManageUsers(actor.role as Role)) return json403('forbidden');

  const found = await findUserOr404(ctx.params.id);
  if ('error' in found) return found.error;

  if (!canResetPassword(actor.role as Role, found.user.role as Role)) {
    return json403('cannot_reset_password_for_this_role');
  }

  const generatedPassword = generatePassword();
  const passwordHash = await bcrypt.hash(generatedPassword, 12);

  const { prisma } = await import('@/lib/db');
  await prisma.user.update({
    where: { id: ctx.params.id },
    data: { passwordHash },
  });

  return NextResponse.json({ generatedPassword });
}