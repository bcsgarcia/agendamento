import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  canAssignRole,
  canManageUsers,
  generatePassword,
  type Role,
} from '@/lib/permissions';
import {
  findUserOr404,
  isValidEmail,
  json400,
  json401,
  json403,
  json409,
  normalizeRoleOrNull,
  requireActor,
} from '@/lib/adminUsersApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Lista todos os users (id, email, name, role, ativo, criadoEm).
 * Permissão: dev, admin.
 */
export async function GET() {
  const actor = await requireActor();
  if (!actor) return json401();
  if (!canManageUsers(actor.role as Role)) return json403('forbidden');

  const users = await prisma.user.findMany({
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ativo: true,
      criadoEm: true,
    },
  });
  return NextResponse.json({ users });
}

/**
 * POST /api/admin/users
 * Body: { email, name, role }
 * Cria user com senha aleatória de 8 dígitos; retorna { user, generatedPassword } UMA VEZ.
 * Permissão: dev, admin (com canAssignRole pra role).
 */
export async function POST(req: NextRequest) {
  const actor = await requireActor();
  if (!actor) return json401();
  if (!canManageUsers(actor.role as Role)) return json403('forbidden');

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json400('invalid_json');
  }

  const email = typeof body?.email === 'string' ? body.email : '';
  const name = typeof body?.name === 'string' ? body.name : null;
  const targetRole = normalizeRoleOrNull(body?.role);

  if (!email) return json400('email_required', 'email');
  if (!isValidEmail(email)) return json400('email_invalid', 'email');
  if (!targetRole) return json400('role_invalid', 'role');

  // admin NÃO pode atribuir/promover pra 'dev' — checagem específica
  if (!canAssignRole(actor.role as Role, targetRole)) {
    return json403('cannot_assign_role');
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return json409('email_already_registered');

  const generatedPassword = generatePassword();
  const passwordHash = await bcrypt.hash(generatedPassword, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
      role: targetRole,
      ativo: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ativo: true,
      criadoEm: true,
    },
  });

  return NextResponse.json({ user, generatedPassword }, { status: 201 });
}