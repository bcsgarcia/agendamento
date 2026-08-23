import Link from 'next/link';
import { Sparkles, Clock, Hash } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatBRL } from '@/lib/helpers';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Check, X as XIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ServicosPage() {
  const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="flex items-center gap-3 mt-2 mb-6">
        <Sparkles className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <h1 className="text-h1 text-text font-semibold">Catálogo de Serviços</h1>
        <Pill variant="inactive">
          {services.length} cadastrado{services.length === 1 ? '' : 's'}
        </Pill>
      </div>

      {services.length === 0 ? (
        <div className="bg-card border border-border-subtle rounded-card px-5 py-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-card bg-card-elevated border border-border-subtle flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-text-muted" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="text-body text-text-muted">Nenhum serviço cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => (
            <Card key={s.id} className="transition-colors duration-150 hover:border-border-default">
              <div className="flex justify-between items-start mb-3 gap-3">
                <h2 className="text-h2 text-text font-medium min-w-0 break-words">{s.name}</h2>
                <Pill variant="active">{formatBRL(s.priceCents)}</Pill>
              </div>

              {s.description && (
                <p className="text-body text-text-muted mb-3 break-words">{s.description}</p>
              )}

              <footer className="flex items-center gap-3 flex-wrap pt-3 border-t border-border-subtle">
                <span className="inline-flex items-center gap-1.5 text-caption text-text-muted">
                  <Clock className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                  {s.durationMin} min
                </span>
                <span className="text-border-default" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 text-caption text-text-muted min-w-0">
                  <Hash className="w-3 h-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                  <code className="font-mono truncate">{s.slug}</code>
                </span>
                <span className="ml-auto">
                  <Pill
                    variant={s.active ? 'active' : 'inactive'}
                    icon={
                      s.active ? (
                        <Check className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        <XIcon className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
                      )
                    }
                  >
                    {s.active ? 'Ativo' : 'Inativo'}
                  </Pill>
                </span>
              </footer>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
