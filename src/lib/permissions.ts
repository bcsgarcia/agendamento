/**
 * RBAC helpers — fonte da verdade das permissões do agendamento.
 *
 * Roles: 'dev' | 'admin' | 'user'
 * - dev: tudo (CRUD users com qualquer role; CRUD feature-flags; CRUD whitelist).
 * - admin: tudo EXCETO Configuração (/admin/feature-flags, /admin/whitelist, /admin/users).
 *   Também NÃO pode promover/promover users pra 'dev' nem resetar senha de 'dev'.
 * - user: mesma navegação do admin (vê as mesmas páginas), MAS
 *   sem permissão de edição: botões somem/disabled, mutações API → 403.
 */

export type Role = 'dev' | 'admin' | 'user';

export const ROLES: Role[] = ['dev', 'admin', 'user'];

/**
 * Type guard: aceita apenas roles conhecidos. Usado em validação de input.
 */
export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ROLES as string[]).includes(v);
}

/**
 * Quem pode acessar /admin/users (listar, criar, editar, resetar senha).
 * user NÃO pode (read-only).
 */
export function canManageUsers(actorRole: Role): boolean {
  return actorRole === 'dev' || actorRole === 'admin';
}

/**
 * Quem pode atribuir um role específico ao criar/editar um user.
 * - dev: qualquer role (dev, admin, user)
 * - admin: admin ou user (NÃO pode promover pra dev)
 * - user: nada
 */
export function canAssignRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === 'dev') return true;
  if (actorRole === 'admin') return targetRole !== 'dev';
  return false;
}

/**
 * Quem pode resetar a senha de um user com role específico.
 * - dev: qualquer user (incluindo outros dev)
 * - admin: admin ou user (NÃO pode resetar senha de dev)
 * - user: ninguém
 */
export function canResetPassword(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === 'dev') return true;
  if (actorRole === 'admin') return targetRole !== 'dev';
  return false;
}

/**
 * Quem pode ver a seção "Configuração" na sidebar
 * (/admin/feature-flags, /admin/whitelist, /admin/users).
 * Apenas dev. Admin e user NÃO veem.
 */
export function canAccessConfig(actorRole: Role): boolean {
  return actorRole === 'dev';
}

/**
 * Quem pode editar dentro do /admin/* (criar/editar/excluir).
 * user NÃO pode — vê os formulários em readonly e botões somem.
 * dev e admin podem editar normalmente (com as exceções de Config
 * já aplicadas por canAccessConfig + permissões específicas).
 */
export function canEditInAdmin(actorRole: Role): boolean {
  return actorRole !== 'user';
}

/**
 * Quem pode excluir users (DELETE /api/admin/users/[id]).
 * Apenas dev — admin pode desativar via PATCH mas NÃO excluir.
 */
export function canDeleteUsers(actorRole: Role): boolean {
  return actorRole === 'dev';
}

/**
 * Gera senha aleatória de 8 dígitos numéricos (ex: "48291735").
 * NÃO é cryptographically secure — usar apenas pra senhas iniciais / reset,
 * nunca como token de sessão ou segredo.
 */
export function generatePassword(): string {
  // 8 dígitos: usa Math.random por simplicidade; colisões em 10^8
  // (~100M combinações) são aceitáveis pra um único seed/reset de senha.
  // Pra segredos de alta entropia, usar crypto.randomBytes.
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
}