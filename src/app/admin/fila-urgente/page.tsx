import Link from 'next/link';
import { Flame, Sparkles, Clock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Pill } from '@/components/ui/Pill';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Tempo decorrido em português (ex: 'há 3 min', 'há 2 h', 'há 1 d').
// Usado no card pra dar sensação de urgência crescente sem virar cronômetro obsessivo.
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

export default async function UrgentesPage() {
  const urgent = await prisma.urgentQueue.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: 'desc' },
  });

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
        <Pill variant={urgent.length > 0 ? 'active' : 'inactive'}>
          {urgent.length} pendente{urgent.length === 1 ? '' : 's'}
        </Pill>
      </div>
      <p className="text-body text-text-muted mb-6">
        Casos que o bot empurrou pra você resolver.
      </p>

      {urgent.length === 0 ? (
        <div className="bg-card border border-border-subtle rounded-card px-5 py-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-card bg-card-elevated border border-border-subtle flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="text-body text-text">Nenhuma urgência pendente.</p>
          <p className="text-caption text-text-muted mt-1">
            Bom momento pra tomar um café ☕
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {urgent.map((u) => (
            <article
              key={u.id}
              className="bg-card border border-border-subtle rounded-card p-5 transition-colors duration-150 hover:border-border-default"
            >
              <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
                <Pill variant="active">{u.reason}</Pill>
                <span className="inline-flex items-center gap-1.5 text-caption text-text-muted shrink-0">
                  <Clock className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                  <span>{timeAgo(u.createdAt, now)}</span>
                  <span className="text-border-default" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-mono">
                    {new Date(u.createdAt).toLocaleString('pt-BR')}
                  </span>
                </span>
              </header>
              <pre className="text-caption text-text font-mono whitespace-pre-wrap break-words bg-app-bg-alt border border-border-subtle rounded-[10px] p-3 leading-relaxed">
                {u.contextSnapshot}
              </pre>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
