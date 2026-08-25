import Link from 'next/link';
import { Flame, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Pill } from '@/components/ui/Pill';
import { FilaTabs, type TabDef } from './FilaTabs';
import { UrgenciaCard, type UrgenciaTab } from './UrgenciaCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type TabId = UrgenciaTab;

const TAB_WHERE: Record<TabId, object> = {
  pendentes: { resolvedAt: null, archivedAt: null },
  concluidos: { resolvedAt: { not: null }, archivedAt: null },
  arquivados: { archivedAt: { not: null } },
};

const TAB_ORDER: Record<TabId, 'createdAt' | 'resolvedAt'> = {
  pendentes: 'createdAt',
  concluidos: 'resolvedAt',
  arquivados: 'createdAt',
};

function resolveTab(raw: string | string[] | undefined): TabId {
  if (typeof raw === 'string' && (raw === 'concluidos' || raw === 'arquivados')) return raw;
  return 'pendentes';
}

// Tempo decorrido em pt-BR (ex: 'há 3 min', 'há 2 h', 'há 1 d').
function timeAgo(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

export default async function UrgentesPage({
  searchParams,
}: {
  searchParams: { tab?: string | string[] };
}) {
  const tab = resolveTab(searchParams.tab);

  // Lista da aba atual.
  // Concluídos: limita a últimos 30 dias (mesma janela da API) pra query não crescer.
  const where =
    tab === 'concluidos'
      ? {
          ...TAB_WHERE.concluidos,
          resolvedAt: { not: null, gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }
      : TAB_WHERE[tab];

  const items = await prisma.urgentQueue.findMany({
    where,
    orderBy: { [TAB_ORDER[tab]]: 'desc' },
  });

  // Contadores pra cada aba (sempre totais, sem filtro de data — usado nas Tabs).
  const [pendentesCount, concluidosCount, arquivadosCount] = await Promise.all([
    prisma.urgentQueue.count({ where: TAB_WHERE.pendentes }),
    prisma.urgentQueue.count({ where: TAB_WHERE.concluidos }),
    prisma.urgentQueue.count({ where: TAB_WHERE.arquivados }),
  ]);

  const tabs: TabDef[] = [
    { id: 'pendentes', label: 'Pendentes', count: pendentesCount },
    { id: 'concluidos', label: 'Concluídos', count: concluidosCount },
    { id: 'arquivados', label: 'Arquivados', count: arquivadosCount },
  ];

  const now = new Date();

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 mt-2 mb-2 flex-wrap">
        <Flame className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <h1 className="text-h1 text-text font-semibold">Fila de Urgências</h1>
        <Pill variant={pendentesCount > 0 ? 'active' : 'inactive'}>
          {pendentesCount} pendente{pendentesCount === 1 ? '' : 's'}
        </Pill>
      </div>
      <p className="text-body text-text-muted mb-5">
        Casos que o bot empurrou pra você resolver.
      </p>

      <div className="mb-5">
        <FilaTabs tabs={tabs} />
      </div>

      {items.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-3">
          {items.map((u) => (
            <UrgenciaCard
              key={u.id}
              tab={tab}
              item={{
                id: u.id,
                reason: u.reason,
                contextSnapshot: u.contextSnapshot,
                createdAt: u.createdAt.toISOString(),
                resolvedAt: u.resolvedAt ? u.resolvedAt.toISOString() : null,
                resolvedNote: u.resolvedNote ?? null,
                archivedAt: u.archivedAt ? u.archivedAt.toISOString() : null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: TabId }) {
  const labelByTab: Record<TabId, string> = {
    pendentes: 'Nenhuma urgência pendente.',
    concluidos: 'Nenhuma urgência concluída nos últimos 30 dias.',
    arquivados: 'Nenhuma urgência arquivada.',
  };
  const subByTab: Record<TabId, string> = {
    pendentes: 'Bom momento pra tomar um café ☕',
    concluidos: 'Quando você resolver uma urgência, ela aparece aqui por 30 dias.',
    arquivados: 'Urgências arquivadas ficam aqui indefinidamente.',
  };
  return (
    <div className="bg-card border border-border-subtle rounded-card px-5 py-12 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-card bg-card-elevated border border-border-subtle flex items-center justify-center mb-3">
        <Sparkles className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <p className="text-body text-text">{labelByTab[tab]}</p>
      <p className="text-caption text-text-muted mt-1">{subByTab[tab]}</p>
    </div>
  );
}
