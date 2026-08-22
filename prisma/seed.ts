/**
 * Setup inicial: cria primeiro admin user.
 *
 * Uso (uma vez, no servidor):
 *   tsx prisma/seed.ts --email=bcsgarcia@outlook.com --password=SuaSenha --name=Bruno
 *
 * Ou via env vars:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... tsx prisma/seed.ts
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function arg(name: string): string | null {
  const flag = `--${name}=`;
  const argv = process.argv.find(a => a.startsWith(flag));
  if (argv) return argv.slice(flag.length);
  const envName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return process.env[envName.toUpperCase()] || process.env[name.toUpperCase()] || null;
}

async function main() {
  const email = arg('email');
  const password = arg('password');
  const name = arg('name') || null;

  if (!email || !password) {
    console.error('Erro: --email e --password são obrigatórios.');
    console.error('Uso: tsx prisma/seed.ts --email=voce@x.com --password=suasenha [--name=SeuNome]');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Erro: senha deve ter pelo menos 8 caracteres.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role: 'admin',
      ativo: true,
    },
    update: {
      passwordHash,
      name,
      ativo: true,
    },
  });

  console.log(`✓ Usuário criado/atualizado: ${user.email} (id: ${user.id})`);
  console.log('Agora faça login em /admin/login');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
