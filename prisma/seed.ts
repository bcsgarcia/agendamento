/**
 * Setup inicial: cria/promove users do sistema.
 *
 * Uso básico (criar novo user admin):
 *   tsx prisma/seed.ts --email=voce@x.com --password=suasenha --name="Seu Nome"
 *
 * Definir role específico:
 *   tsx prisma/seed.ts --email=voce@x.com --password=suasenha --role=dev
 *
 * Promover user existente pra outro role (sem mudar senha):
 *   tsx prisma/seed.ts --email=existente@x.com --promote-to=dev
 *
 * Bootstrap do primeiro DEV (caso especial): use env vars ADMIN_DEV_EMAIL + ADMIN_DEV_PASSWORD.
 *   ADMIN_DEV_EMAIL=bruno@x.com ADMIN_DEV_PASSWORD=SuaSenhaForte tsx prisma/seed.ts --bootstrap-dev
 *
 * Ou via env vars (preferido pra Docker):
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... ADMIN_ROLE=admin tsx prisma/seed.ts
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_ROLES = ['dev', 'admin', 'user'] as const;
type Role = (typeof VALID_ROLES)[number];

function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (VALID_ROLES as readonly string[]).includes(v);
}

function arg(name: string): string | null {
  // Primeiro tenta via flag --email=...
  const flag = `--${name}=`;
  const argv = process.argv.find((a) => a.startsWith(flag));
  if (argv) return argv.slice(flag.length);
  // Depois tenta ADMIN_<NAME> em uppercase (preferido em Docker)
  const adminEnv = process.env[`ADMIN_${name.toUpperCase()}`];
  if (adminEnv) return adminEnv;
  // Fallback: <NAME> em uppercase
  const envName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return process.env[envName.toUpperCase()] || null;
}

function printHelp() {
  console.log(`
Uso:
  tsx prisma/seed.ts --email=<email> --password=<senha> [--name=<nome>] [--role=dev|admin|user]
  tsx prisma/seed.ts --email=<email> --promote-to=dev|admin|user
  tsx prisma/seed.ts --bootstrap-dev   (lê ADMIN_DEV_EMAIL + ADMIN_DEV_PASSWORD do env)

Variáveis de ambiente (alternativa):
  ADMIN_EMAIL=...
  ADMIN_PASSWORD=...
  ADMIN_NAME=...
  ADMIN_ROLE=admin (default)
  ADMIN_DEV_EMAIL=... (apenas pra --bootstrap-dev)
  ADMIN_DEV_PASSWORD=... (apenas pra --bootstrap-dev)

Roles:
  - dev: tudo (CRUD users com qualquer role; CRUD feature-flags; CRUD whitelist)
  - admin: tudo EXCETO Configuração (/admin/feature-flags, /admin/whitelist, /admin/users)
  - user: somente leitura

Exemplos:
  # criar admin
  tsx prisma/seed.ts --email=aline@x.com --password=SenhaForte2026 --role=admin

  # promover user existente pra dev
  tsx prisma/seed.ts --email=bcsgarcia@outlook.com --promote-to=dev

  # bootstrap inicial do primeiro dev (env vars)
  ADMIN_DEV_EMAIL=bruno@x.com ADMIN_DEV_PASSWORD=SenhaForte tsx prisma/seed.ts --bootstrap-dev
`);
}

async function bootstrapDev() {
  const email = process.env.ADMIN_DEV_EMAIL;
  const password = process.env.ADMIN_DEV_PASSWORD;
  const name = process.env.ADMIN_DEV_NAME || null;

  if (!email || !password) {
    console.error('Erro: --bootstrap-dev requer ADMIN_DEV_EMAIL e ADMIN_DEV_PASSWORD.');
    printHelp();
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
      role: 'dev',
      ativo: true,
    },
    update: {
      // Bootstrap do primeiro dev: reescreve senha e força role 'dev'.
      passwordHash,
      name,
      role: 'dev',
      ativo: true,
    },
  });
  console.log(`✓ DEV bootstrap: ${user.email} (id: ${user.id}) role=${user.role}`);
}

async function main() {
  // --help / --h
  if (process.argv.some((a) => a === '--help' || a === '-h')) {
    printHelp();
    return;
  }

  // --bootstrap-dev: caso especial de criar/promover o primeiro dev.
  if (process.argv.some((a) => a === '--bootstrap-dev')) {
    await bootstrapDev();
    return;
  }

  const email = arg('email');
  const password = arg('password');
  const name = arg('name') || null;
  const promoteTo = arg('promote-to');
  const roleArg = arg('role');

  // --promote-to: não muda senha, só atualiza o role.
  if (promoteTo) {
    if (!email) {
      console.error('Erro: --promote-to requer --email.');
      printHelp();
      process.exit(1);
    }
    if (!isRole(promoteTo)) {
      console.error(`Erro: --promote-to deve ser um de: ${VALID_ROLES.join(', ')}`);
      process.exit(1);
    }
    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { role: promoteTo },
    });
    console.log(`✓ ${user.email} promovido para role=${user.role}`);
    return;
  }

  // Caminho padrão: criar/atualizar user (com senha).
  if (!email || !password) {
    console.error('Erro: --email e --password são obrigatórios (ou use --promote-to / --bootstrap-dev).');
    printHelp();
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Erro: senha deve ter pelo menos 8 caracteres.');
    process.exit(1);
  }

  const role: Role = isRole(roleArg) ? roleArg : 'admin';

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role,
      ativo: true,
    },
    update: {
      passwordHash,
      name,
      role,
      ativo: true,
    },
  });

  console.log(`✓ Usuário criado/atualizado: ${user.email} (id: ${user.id}) role=${user.role}`);
  console.log('Agora faça login em /admin/login');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());