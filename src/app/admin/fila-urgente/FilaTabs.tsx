'use client';

// Tabs da Fila de Urgências: navegação via ?tab= no URL.
// - Server Component (page.tsx) lê o param e filtra a lista.
// - Click numa tab faz router.push('?tab=X') e o Server Component re-renderiza.
// - Não mantém estado client: o URL é a fonte da verdade (favoritável/compartilhável).

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/components/ui/cn';

export interface TabDef {
  id: 'pendentes' | 'concluidos' | 'arquivados';
  label: string;
  count: number;
}

export function FilaTabs({ tabs }: { tabs: TabDef[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const active = (params.get('tab') ?? 'pendentes') as TabDef['id'];

  function go(id: TabDef['id']) {
    if (id === active) return;
    const next = new URLSearchParams(params.toString());
    next.set('tab', id);
    router.push(`?${next.toString()}`);
  }

  return (
    <div
      role="tablist"
      aria-label="Filtros da fila de urgências"
      className="inline-flex items-center gap-1 p-1 bg-card border border-border-subtle rounded-card"
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => go(t.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-[10px] text-label font-medium',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent/30',
              isActive
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text hover:bg-card-elevated',
            )}
          >
            {t.label}
            <span
              className={cn(
                'ml-2 inline-flex items-center justify-center min-w-[1.25rem] px-1.5 rounded-pill text-caption font-mono',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-app-bg-alt text-text-muted',
              )}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
