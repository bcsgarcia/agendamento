import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './db';

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_DAYS = 7;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Faz login: valida credenciais e cria sessão. Retorna true se sucesso. */
export async function login(email: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.ativo) return false;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return false;

  // Cookie guarda o HASH (não o raw). DB também guarda o hash → compare direto
  // em getCurrentUser/requireUser/logout sem re-hashear. rawToken nunca é exposto.
  const hashedToken = hashToken(crypto.randomBytes(32).toString('hex'));
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: hashedToken,
      expires,
    },
  });

  // Cookie guarda o HASH (mesmo valor que vai pra DB). Compare direto nas leituras.
  cookies().set(SESSION_COOKIE, hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });

  return true;
}

/** Faz logout: invalida a sessão atual. */
export async function logout(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    // O cookie agora guarda o hash diretamente, sem necessidade de re-hashear.
    await prisma.session.deleteMany({ where: { sessionToken: token } }).catch(() => {});
  }
  cookies().delete(SESSION_COOKIE);
}

/** Retorna o usuário logado ou null. */
export async function getCurrentUser(): Promise<{ id: string; email: string; name: string | null } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session || session.expires < new Date() || !session.user.ativo) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

/** Cria um usuário (uso: script de setup). */
export async function createUser(email: string, password: string, name?: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    create: { email: email.toLowerCase().trim(), passwordHash, name },
    update: { passwordHash, name },
  });
}
