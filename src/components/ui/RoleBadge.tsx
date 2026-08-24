/**
 * Badge colorido pra cada Role.
 * - dev: gradient accent (mesma paleta dos CTAs primários) — destaque máximo.
 * - admin: accent-bg sólido (violeta, similar mas mais discreto).
 * - user: pill-inactive (neutro).
 */
import { Pill } from './Pill';
import type { Role } from '@/lib/permissions';

const ROLE_LABEL: Record<Role, string> = {
  dev: 'dev',
  admin: 'admin',
  user: 'user',
};

export function RoleBadge({ role }: { role: string }) {
  const known = role === 'dev' || role === 'admin' || role === 'user';
  const variant: 'active' | 'inactive' = known && role !== 'user' ? 'active' : 'inactive';
  return <Pill variant={variant}>{known ? ROLE_LABEL[role as Role] : role}</Pill>;
}