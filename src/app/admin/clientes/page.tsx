import Link from 'next/link';
import { Users, AlertTriangle, Hash } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Pill } from '@/components/ui/Pill';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ClientesPage() {
  const customers = await prisma.customer.findMany({
    include: {
      bookings: { include: { service: true }, orderBy: { startsAt: 'desc' }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const totalBookings = customers.reduce((acc, c) => acc + c.bookings.length, 0);

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="flex items-center gap-3 mt-2 mb-6">
        <Users className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <h1 className="text-h1 text-text font-semibold">Clientes</h1>
        <Pill variant="inactive">
          {customers.length} cadastrado{customers.length === 1 ? '' : 's'}
        </Pill>
      </div>

      {customers.length === 0 ? (
        <div className="bg-card border border-border-subtle rounded-card px-5 py-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-card bg-card-elevated border border-border-subtle flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-text-muted" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="text-body text-text-muted">Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customers.map((c) => (
            <article
              key={c.id}
              className="bg-card border border-border-subtle rounded-card p-5 transition-colors duration-150 hover:border-border-default"
            >
              <header className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h2 className="text-h2 text-text font-medium truncate">
                    {c.name || 'Sem nome'}
                  </h2>
                  <div className="font-mono text-caption text-text-muted mt-0.5">{c.phone}</div>
                </div>
                <Pill variant="inactive">
                  {c.bookings.length} booking{c.bookings.length === 1 ? '' : 's'}
                </Pill>
              </header>

              {c.allergies && (
                <div className="mt-3 flex items-start gap-2 text-label text-danger bg-danger/10 border border-danger/30 rounded-[10px] px-3 py-2">
                  <AlertTriangle
                    className="w-3.5 h-3.5 shrink-0 mt-0.5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">{c.allergies}</span>
                </div>
              )}

              {c.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Hash className="w-3 h-3 text-text-muted" strokeWidth={2} aria-hidden="true" />
                  {c.tags.map((tag) => (
                    <Pill key={tag} variant="active">
                      {tag}
                    </Pill>
                  ))}
                </div>
              )}

              {c.bookings.length > 0 && (
                <footer className="mt-4 pt-3 border-t border-border-subtle">
                  <div className="text-caption uppercase tracking-wide text-text-muted mb-1.5">
                    Últimos agendamentos
                  </div>
                  <ul className="space-y-1 text-label text-text-muted">
                    {c.bookings.map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-2">
                        <span className="font-mono">
                          {new Date(b.startsAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                        <span className="truncate">{b.service.name}</span>
                      </li>
                    ))}
                  </ul>
                </footer>
              )}
            </article>
          ))}
        </div>
      )}

      {customers.length > 0 && (
        <p className="text-caption text-text-muted mt-6">
          Mostrando os {customers.length} mais recentes · {totalBookings} agendamentos no total
          (amostra de até 3 por cliente).
        </p>
      )}
    </div>
  );
}
