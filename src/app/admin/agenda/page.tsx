import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Pill } from '@/components/ui/Pill';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mapa de cor por status de booking (alinhado com Pill variants do PR-2).
// scheduled = aguardando confirmação, confirmed = confirmado, cancelled = cancelado,
// completed/default = restantes (estado pós-atendimento etc.).
const STATUS_PILL: Record<string, { variant: 'active' | 'inactive'; label: string }> = {
  scheduled: { variant: 'active', label: 'agendado' },
  confirmed: { variant: 'active', label: 'confirmado' },
  cancelled: { variant: 'inactive', label: 'cancelado' },
  completed: { variant: 'inactive', label: 'concluído' },
};

export default async function AgendaPage() {
  const bookings = await prisma.booking.findMany({
    include: { customer: true, service: true },
    orderBy: { startsAt: 'asc' },
    take: 50,
  });

  const byDay = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = b.startsAt.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(b);
  }

  const dayCount = byDay.size;

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="flex items-center gap-3 mt-2 mb-6">
        <CalendarDays className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <h1 className="text-h1 text-text font-semibold">Agenda</h1>
        <Pill variant="inactive">
          {bookings.length} booking{bookings.length === 1 ? '' : 's'}
        </Pill>
      </div>

      {dayCount === 0 && (
        <div className="bg-card border border-border-subtle rounded-card px-5 py-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-card bg-card-elevated border border-border-subtle flex items-center justify-center mb-3">
            <CalendarDays className="w-6 h-6 text-text-muted" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="text-body text-text-muted">Nenhum booking cadastrado ainda.</p>
        </div>
      )}

      <div className="space-y-6">
        {[...byDay.entries()].map(([day, dayBookings]) => (
          <section key={day}>
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="text-h2 text-text font-medium">
                {new Date(day).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </h2>
              <span className="text-caption text-text-muted">
                · {dayBookings.length} agendamento{dayBookings.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="bg-card border border-border-subtle rounded-card overflow-hidden shadow-card">
              <ul className="divide-y divide-border-subtle">
                {dayBookings.map((b) => {
                  const status = STATUS_PILL[b.status] ?? STATUS_PILL.completed;
                  return (
                    <li
                      key={b.id}
                      className="px-5 py-4 flex justify-between items-start gap-4 transition-colors duration-150 hover:bg-card-elevated"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-label text-text-muted">
                          {b.startsAt.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' → '}
                          {b.endsAt.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-body text-text font-medium mt-1">
                          {b.customer.name || b.customer.phone}
                        </div>
                        <div className="text-label text-text-muted mt-0.5">{b.service.name}</div>
                      </div>
                      <Pill variant={status.variant}>{status.label}</Pill>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
