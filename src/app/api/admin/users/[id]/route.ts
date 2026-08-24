import { NextRequest, NextResponse } from 'next/server';
import {
  canAssignRole,
  canDeleteUsers,
  canManageUsers,
  type Role,
} from '@/lib/permissions';
import {
  findUserOr404,
  json400,
  json401,
  json403,
  normalizeRoleOrNull,
  requireActor,
} from '@/lib/adminUsersApi';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * PATCH /api/admin/users/[id]
 * Body: { name?, role?, ativo? }
 * Atualiza; se role novo !== role atual E canAssignRole === false → 403.
 * Email é imutável.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const actor = await requireActor();
  if (!actor) return json401();
  if (!canManageUsers(actor.role as Role)) return json403('forbidden');

  const found = await findUserOr404(ctx.params.id);
  if ('error' in found) return found.error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json400('invalid_json');
  }

  const data: { name?: string | null; role?: Role; ativo?: boolean } = {};

  if (body?.name !== undefined) {
    if (typeof body.name !== 'string') return json400('name_invalid', 'name');
    data.name = body.name.trim() === '' ? null : body.name.trim();
  }

  if (body?.role !== undefined) {
    const targetRole = normalizeRoleOrNull(body.role);
    if (!targetRole) return json400('role_invalid', 'role');
    if (targetRole !== found.user.role && !canAssignRole(actor.role as Role, targetRole)) {
      return json403('cannot_assign_role');
    }
    data.role = targetRole;
  }

  if (body?.ativo !== undefined) {
    if (typeof body.ativo !== 'boolean') return json400('ativo_invalid', 'ativo');
    data.ativo = body.ativo;
  }

  if (Object.keys(data).length === 0) {
    return json400('no_fields_to_update');
  }

  const { prisma } = await import('@/lib/db');
  const updated = await prisma.user.update({
    where: { id: ctx.params.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ativo: true,
      criadoEm: true,
    },
  });
  return NextResponse.json({ user: updated });
}

/**
 * DELETE /api/admin/users/[id]
 * Soft delete: ativo: false (NÃO hard delete — preserva audit / sessions antigas).
 * Permissão: APENAS dev.
 */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const actor = await requireActor();
  if (!actor) return json401();
  if (!canDeleteUsers(actor.role as Role)) return json403('only_dev_can_delete');

  const found = await findUserOr404(ctx.params.id);
  if ('error' in found) return found.error;

  const { prisma } = await import('@/lib/db');
  await prisma.user.update({
    where: { id: ctx.params.id },
    data: { ativo: false },
  });
  return NextResponse.json({ ok: true, id: ctx.params.id, ativo: false });
}