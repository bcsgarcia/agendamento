import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Clock, User, Scissors, Pencil } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatEUR } from '@/lib/helpers';
import { Card, Pill } from '@/components/ui';
import { fmtDate, fmtTime, fmtDateTime, toLocalInput } from '@/lib/agenda-helpers';
import { QuickBookingAction } from './QuickBookingAction';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_PILL: Record<string, { variant: 'active' | 'inactive'; label: string }> = {
  scheduled: { variant: 'active', label: 'agendado' },
  confirmed: { variant: 'active', label: 'confirmado' },
  completed: { variant: 'inactive', label: 'concluído' },
  cancelled: { variant: 'inactive', label: 'cancelado' },
  no_show: { variant: 'inactive', label: 'não compareceu' },
};

export default async function BookingDetalhePage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { customer: true, service: true },
  });

  if (!booking) notFound();

  const status = STATUS_PILL[booking.status] ?? STATUS_PILL.completed!;
  const customerLabel = booking.customer.name || booking.customer.phone;

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <Link
        href="/admin/agenda"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para agenda
      </Link>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mt-2 mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-caption text-text-muted">
            <CalendarDays className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Booking</span>
          </div>
          <h1 className="text-h1 text-text font-semibold mt-1">
            {customerLabel}
          </h1>
          <div className="text-body text-text-muted mt-1">
            {booking.service.name}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            <Pill variant={status.variant}>{status.label}</Pill>
            {booking.confirmedAt && (
              <Pill variant="active">
                confirmado em {fmtDate(booking.confirmedAt)}
              </Pill>
            )}
          </div>
        </div>
        <Link
          href={`/admin/agenda/${booking.id}/editar`}
          className="self-start sm:self-auto shrink-0 px-4 py-2 rounded-card text-label font-medium border border-border-subtle bg-card text-text hover:bg-card-elevated transition-colors duration-150 flex items-center gap-2"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
          Editar
        </Link>
      </div>

      {/* Info em cards — visual consistente com /admin/cursos/[id] (PR-5). */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-pill bg-accent/15 text-accent-glow-bright grid place-items-center shrink-0">
              <Clock className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-caption uppercase tracking-wide text-text-muted">Quando</div>
              <div className="text-body text-text mt-1 font-medium">
                {fmtDateTime(booking.startsAt)}
              </div>
              <div className="text-caption text-text-muted">
                até {fmtTime(booking.endsAt)} · {Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000)} min
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-pill bg-accent/15 text-accent-glow-bright grid place-items-center shrink-0">
              <User className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-caption uppercase tracking-wide text-text-muted">Cliente</div>
              <div className="text-body text-text mt-1 font-medium">
                {booking.customer.name || 'sem nome'}
              </div>
              <div className="text-caption text-text-muted font-mono">
                {booking.customer.phone}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-pill bg-accent/15 text-accent-glow-bright grid place-items-center shrink-0">
              <Scissors className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-caption uppercase tracking-wide text-text-muted">Serviço</div>
              <div className="text-body text-text mt-1 font-medium">
                {booking.service.name}
              </div>
              <div className="text-caption text-text-muted">
                {booking.service.durationMin} min · {formatEUR(booking.service.priceCents)}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-pill bg-card-elevated text-text-muted grid place-items-center shrink-0 text-caption font-mono">
              {fmtDate(booking.createdAt)}
            </div>
            <div className="min-w-0">
              <div className="text-caption uppercase tracking-wide text-text-muted">Criado em</div>
              <div className="text-body text-text mt-1">
                {fmtDate(booking.createdAt)}
              </div>
              {booking.confirmedAt && (
                <div className="text-caption text-text-muted">
                  confirmado em {fmtDateTime(booking.confirmedAt)}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {booking.notes && (
        <Card className="mb-6">
          <div className="text-caption uppercase tracking-wide text-text-muted mb-2">Observações</div>
          <p className="text-body text-text whitespace-pre-wrap">{booking.notes}</p>
        </Card>
      )}

      {/* Ações de status — botões server-side via form action direto.
          Mantém o princípio "server actions são endpoints POST", evita JS extra.
          Cancelar/cancelado ficam disabled pra não regredir estado terminal. */}
      <Card>
        <div className="text-caption uppercase tracking-wide text-text-muted mb-3">
          Ações de status
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickBookingAction
            id={booking.id}
            action="confirm"
            label="Confirmar"
            disabled={booking.status === 'confirmed' || booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show'}
          />
          <QuickBookingAction
            id={booking.id}
            action="cancel"
            label="Cancelar booking"
            variant="danger"
            disabled={booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show'}
          />
        </div>
        <p className="text-caption text-text-muted mt-3">
          Status muda em tempo real. Para editar dados (cliente, datas, etc.), use "Editar".
        </p>
      </Card>
    </main>
  );
}
