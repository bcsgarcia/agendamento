/**
 * Helpers pra API routes de admin/users.
 *
 * Centraliza:
 * - Parsing/validação do body
 * - Códigos de erro (401, 403, 404, 409, 400)
 * - Validação de email (sem regex pesada — basta formato minimo)
 */
import { NextResponse } from 'next/server';
import { prisma } from './db';
import { getCurrentUser } from './auth';
import type { Role } from './permissions';
import { isRole, ROLES } from './permissions';

export type ActorUser = {
  id: string;
  email: string;
  role: string;
};

/**
 * Resolve o usuário autenticado + seu role tipado.
 * Retorna null se não autenticado ou role inválido.
 */
export async function requireActor(): Promise<ActorUser | null> {
  const u = await getCurrentUser();
  if (!u) return null;
  if (!isRole(u.role)) return null;
  return { id: u.id, email: u.email, role: u.role };
}

export function json401() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export function json403(message = 'forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function json400(message: string, field?: string) {
  return NextResponse.json({ error: message, field }, { status: 400 });
}

export function json404(message = 'not_found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function json409(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

/**
 * Validação simples de email — formato x@y.z, sem verificar entrega.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  // 1+ chars antes do @, 1+ chars entre @ e ., 2+ chars depois do .
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/**
 * Retorna a role normalizada (lowercase + trim) ou null se inválida.
 */
export function normalizeRoleOrNull(v: unknown): Role | null {
  if (typeof v !== 'string') return null;
  const norm = v.toLowerCase().trim();
  return (ROLES as string[]).includes(norm) ? (norm as Role) : null;
}

/**
 * Busca user por id ou retorna erro 404 se não existe.
 */
export async function findUserOr404(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: json404('user_not_found') } as const;
  return { user } as const;
}