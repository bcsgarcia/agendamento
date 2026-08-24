import Link from 'next/link';
import { Flag, Info } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { FeatureFlagRow } from './FeatureFlagRow';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Seeds — garante que todas as flags padrão existam antes de renderizar. */
const DEFAULT_FLAGS = [
  {
    nome: 'whitelist_enabled',
    descricao:
      'Filtro de números autorizados (ignora silenciosamente quem não tá na whitelist)',
  },
  {
    nome: 'ai_ativa',
    descricao: 'Se falso, bot responde com mensagem padrão sem chamar LLM',
  },
  {
    nome: 'modo_debug',
    descricao: 'Logs verbosos no Fluxi (debug de mensagens)',
  },
  {
    nome: 'manutencao',
    descricao: 'Bot responde com "em manutenção" pra qualquer msg',
  },
] as const;

export default async function FeatureFlagsPage() {
  // 1. Garante que as flags padrão existem (idempotente — catch em falha de race).
  for (const d of DEFAULT_FLAGS) {
    await prisma.featureFlag
      .create({
        data: { nome: d.nome, ativo: false, descricao: d.descricao },
      })
      .catch(() => {
        /* já existe — ok */
      });
  }

  // 2. Busca estado canônico para renderizar.
  const allFlags = await prisma.featureFlag.findMany({
    orderBy: { nome: 'asc' },
  });

  const activeCount = allFlags.filter((f) => f.ativo).length;

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 mt-2 mb-2 flex-wrap">
        <Flag className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <h1 className="text-h1 text-text font-semibold">Feature Flags</h1>
        <Pill variant="inactive">
          {activeCount} ativa{activeCount === 1 ? '' : 's'} · {allFlags.length} no total
        </Pill>
      </div>

      <p className="text-body text-text-muted mb-6">
        Liga/desliga funcionalidades em tempo real (sem deploy). Cada toggle salva ao
        clicar — efeito em ~5 segundos (cache).
      </p>

      <Card>
        <div className="flex items-start gap-2 px-5 py-3 border-b border-border-subtle bg-card-elevated rounded-t-card">
          <Info
            className="w-4 h-4 shrink-0 mt-0.5 text-text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
          <p className="text-caption text-text-muted">
            Use com cuidado. Flags como <code className="font-mono text-accent">manutencao</code>{' '}
            ou <code className="font-mono text-accent">ai_ativa=false</code> afetam o atendimento
            dos clientes em tempo real.
          </p>
        </div>
        {allFlags.length === 0 ? (
          <div className="px-5 py-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-card bg-card-elevated border border-border-subtle flex items-center justify-center mb-3">
              <Flag className="w-6 h-6 text-text-muted" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className="text-body text-text-muted">
              Nenhuma feature flag cadastrada.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {allFlags.map((f) => (
              <li key={f.id}>
                <FeatureFlagRow
                  id={f.id}
                  nome={f.nome}
                  ativo={f.ativo}
                  descricao={f.descricao}
                  atualizadoEm={f.atualizadoEm}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
  </div>
  );
}
