/**
 * Setup inicial: cria/promove users do sistema.
 *
 * Política (2026-08-24): seed NUNCA roda automaticamente no boot do container.
 * Toda criação/promoção/reset de password é feita explicitamente, via CLI,
 * por um operador que está rodando o comando de propósito.
 *
 * Caminhos de uso:
 *
 *   # Criar primeiro dev do zero (banco vazio). Exige env vars
 *   ADMIN_DEV_EMAIL=bruno@x.com ADMIN_DEV_PASSWORD=SuaSenhaForte \
 *     tsx prisma/seed.ts --bootstrap-dev
 *
 *   # Promover user existente pra outro role (sem mudar senha, sem sobrescrever nada)
 *   tsx prisma/seed.ts --email=existente@x.com --promote-to=dev
 *
 *   # Resetar senha de user existente (gera hash novo, mantém role/ativo)
 *   tsx prisma/seed.ts --email=existente@x.com --reset-password=NovaSenha123
 *
 *   # Criar novo user admin/user (erro se já existir — use --reset-password ou --promote-to)
 *   tsx prisma/seed.ts --create --email=novo@x.com --password=SenhaForte --role=admin
 *
 * IMPORTANTE: nenhuma combinação de env vars (ADMIN_EMAIL, ADMIN_PASSWORD, etc.)
 * roda mais automaticamente. O Dockerfile do app não invoca o seed no boot.
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_ROLES = ['dev', 'admin', 'user'] as const;
type Role = (typeof VALID_ROLES)[number];

function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (VALID_ROLES as readonly string[]).includes(v);
}

function hasFlag(name: string): boolean {
  return process.argv.some((a) => a === `--${name}`);
}

function printHelp() {
  console.log(`
Uso:
  # 1) Bootstrap do primeiro dev (banco vazio)
  ADMIN_DEV_EMAIL=bruno@x.com ADMIN_DEV_PASSWORD=SuaSenhaForte \\
    tsx prisma/seed.ts --bootstrap-dev

  # 2) Promover user existente pra outro role (não mexe em senha)
  tsx prisma/seed.ts --email=existente@x.com --promote-to=dev|admin|user

  # 3) Resetar senha de user existente (não mexe em role)
  tsx prisma/seed.ts --email=existente@x.com --reset-password=NovaSenha123

  # 4) Criar novo user (erro se email já existir)
  tsx prisma/seed.ts --create \\
    --email=novo@x.com --password=SenhaForte [--name="Nome"] [--role=admin|user]

Variáveis de ambiente (apenas pra --bootstrap-dev):
  ADMIN_DEV_EMAIL=...
  ADMIN_DEV_PASSWORD=...
  ADMIN_DEV_NAME=...

Roles:
  - dev:   tudo (CRUD users com qualquer role; CRUD feature-flags; CRUD whitelist)
  - admin: tudo EXCETO Configuração (/admin/feature-flags, /admin/whitelist, /admin/users)
  - user:  somente leitura

Regra operacional (2026-08-24):
  - O seed NÃO roda no boot do container. Toda mutação em User é explícita.
  - Pra criar user novo, use a UI /admin/users (precisa ser dev logado).
  - Pra resetar senha esquecida, use este script com --reset-password.
  - Pra promover user, use este script com --promote-to.
`);
}

function getArg(name: string): string | null {
  const flag = `--${name}=`;
  const argv = process.argv.find((a) => a.startsWith(flag));
  return argv ? argv.slice(flag.length) : null;
}

async function bootstrapDev() {
  const email = process.env.ADMIN_DEV_EMAIL;
  const password = process.env.ADMIN_DEV_PASSWORD;
  const name = process.env.ADMIN_DEV_NAME || null;

  if (!email || !password) {
    console.error('Erro: --bootstrap-dev requer ADMIN_DEV_EMAIL e ADMIN_DEV_PASSWORD no env.');
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
      // Só usado uma vez (banco vazio); seguro sobrescrever.
      passwordHash,
      name,
      role: 'dev',
      ativo: true,
    },
  });
  console.log(`✓ DEV bootstrap: ${user.email} (id: ${user.id}) role=${user.role}`);
}

async function main() {
  if (hasFlag('help') || hasFlag('h')) {
    printHelp();
    return;
  }

  if (hasFlag('bootstrap-dev')) {
    await bootstrapDev();
    return;
  }

  // --promote-to=<role>: muda role, NÃO mexe em senha/name/outros campos
  const promoteTo = getArg('promote-to');
  if (promoteTo) {
    const email = getArg('email');
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

  // --reset-password=<senha>: muda senha, NÃO mexe em role/name/outros campos
  const resetPassword = getArg('reset-password');
  if (resetPassword) {
    const email = getArg('email');
    if (!email) {
      console.error('Erro: --reset-password requer --email.');
      printHelp();
      process.exit(1);
    }
    if (resetPassword.length < 8) {
      console.error('Erro: senha deve ter pelo menos 8 caracteres.');
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(resetPassword, 12);
    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { passwordHash },
    });
    console.log(`✓ ${user.email}: senha resetada (role=${user.role}, ativo=${user.ativo})`);
    return;
  }

  // --create: criar novo user (ERRO se email já existir — força uso de --reset-password / --promote-to)
  if (hasFlag('create')) {
    const email = getArg('email');
    const password = getArg('password');
    const name = getArg('name') || null;
    const roleArg = getArg('role');

    if (!email || !password) {
      console.error('Erro: --create requer --email e --password.');
      printHelp();
      process.exit(1);
    }
    if (password.length < 8) {
      console.error('Erro: senha deve ter pelo menos 8 caracteres.');
      process.exit(1);
    }
    if (roleArg && !isRole(roleArg)) {
      console.error(`Erro: --role deve ser um de: ${VALID_ROLES.join(', ')}`);
      process.exit(1);
    }

    const role: Role = roleArg && isRole(roleArg) ? roleArg : 'admin';
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role,
        ativo: true,
      },
    });
    console.log(`✓ User criado: ${user.email} (id: ${user.id}) role=${user.role}`);
    return;
  }

  // Sem flag reconhecida: erro + help
  console.error('Erro: nenhuma operação especificada.');
  printHelp();
  process.exit(1);
}

main()
  .catch((e: any) => {
    // P2002 = unique constraint violation. Pra --create com email duplicado,
    // mostramos mensagem clara (em vez do stack trace do Prisma).
    if (e?.code === 'P2002' && hasFlag('create')) {
      const email = getArg('email');
      console.error(
        `Erro: já existe user com email "${email}". ` +
          'Use --reset-password ou --promote-to pra modificar existente.',
      );
      process.exit(1);
    }
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
