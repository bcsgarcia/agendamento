// Detalhe do cliente: header, stats (bookings/alergias), últimos agendamentos,
// ações (Editar / Excluir). Visual: Dark Violet.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, Phone, User, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Card, Pill, StatTile } from '@/components/ui';
import { ExcluirClienteButton } from '../ExcluirClienteButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(d: Date | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return (
    date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ' ' +
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

function calcAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export default async function ClienteDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      bookings: {
        orderBy: { startsAt: 'desc' },
        take: 10,
        include: { service: { select: { name: true, durationMin: true } } },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!customer) notFound();

  const age = calcAge(customer.birthDate);
  const lastBooking = customer.bookings[0] ?? null;
  const totalBookings = customer._count.bookings;

  // Booking status → classes semânticas (mesmo padrão de /admin/aulas)
  const BOOKING_STATUS_CLASS: Record<string, string> = {
    scheduled: 'bg-accent-bg text-accent-glow-bright border border-accent/30',
    confirmed: 'bg-success/15 text-success border border-success/40',
    completed: 'bg-card-elevated text-text-muted border border-border-subtle',
    cancelled: 'bg-danger/15 text-danger border border-danger/40',
    no_show: 'bg-card-elevated text-text-muted border border-border-subtle',
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <Link
        href="/admin/clientes"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para clientes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mt-2 mb-6 gap-4">
        <div className="min-w-0">
          <h1 className="text-h1 text-text font-semibold truncate">
            {customer.name || 'Sem nome'}
          </h1>
          <div className="text-body text-text-muted font-mono mt-1">
            {customer.phone}
          </div>
          {customer.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {customer.tags.map((t: string) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href={`/admin/clientes/${customer.id}/editar`}
            className="px-4 py-2 rounded-card text-label font-medium border border-border-subtle bg-card text-text hover:bg-card-elevated transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            Editar
          </Link>
          <ExcluirClienteButton
            id={customer.id}
            name={customer.name ?? 'Sem nome'}
            variant="detail"
          />
        </div>
      </div>

      {/* Stats (4 tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile
          label="Total de agendamentos"
          value={totalBookings}
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <StatTile
          label="Último agendamento"
          value={fmtDate(lastBooking?.startsAt ?? null)}
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <StatTile
          label="Idade"
          value={age != null ? `${age} anos` : '—'}
          icon={<User className="w-5 h-5" />}
        />
        <StatTile
          label="Telefone"
          value={<span className="font-mono text-h2">{customer.phone}</span>}
          icon={<Phone className="w-5 h-5" />}
        />
      </div>

      {/* Alergias — destaque visual (comum em clínica de estética) */}
      {customer.allergies && (
        <Card className="mb-8 border-danger/40 bg-danger/10">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-pill grid place-items-center bg-danger/15 text-danger">
              <AlertTriangle className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-h2 text-danger font-semibold">Alergias</h2>
              <p className="text-body text-text mt-1 whitespace-pre-wrap">
                {customer.allergies}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Detalhes secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <Card>
          <h2 className="text-h2 text-text font-medium mb-3">Perfil</h2>
          <dl className="space-y-2 text-body">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3">
              <dt className="text-caption uppercase tracking-wide text-text-muted">
                Nome
              </dt>
              <dd className="text-text sm:text-right">{customer.name || '—'}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3">
              <dt className="text-caption uppercase tracking-wide text-text-muted">
                Nascimento
              </dt>
              <dd className="text-text sm:text-right">
                {customer.birthDate ? (
                  <>
                    {fmtDate(customer.birthDate)}
                    {age != null && (
                      <span className="text-text-muted"> · {age} anos</span>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3">
              <dt className="text-caption uppercase tracking-wide text-text-muted">
                Horário preferido
              </dt>
              <dd className="text-text sm:text-right">
                {customer.preferredTime || '—'}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3">
              <dt className="text-caption uppercase tracking-wide text-text-muted">
                Criado em
              </dt>
              <dd className="text-text sm:text-right">{fmtDateTime(customer.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        {customer.notes && (
          <Card>
            <h2 className="text-h2 text-text font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-text-muted" aria-hidden="true" />
              Observações
            </h2>
            <p className="text-body text-text-muted whitespace-pre-wrap">
              {customer.notes}
            </p>
          </Card>
        )}
      </div>

      {/* Histórico de agendamentos (últimos 10) */}
      <h2 className="text-h2 text-text font-medium mb-3">Histórico de agendamentos</h2>
      <Card className="p-0 overflow-hidden">
        {customer.bookings.length === 0 ? (
          <div className="px-5 py-10 text-center text-text-muted">
            Nenhum agendamento ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead className="bg-card-elevated">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-caption uppercase tracking-wide text-text-muted">
                    Quando
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-caption uppercase tracking-wide text-text-muted">
                    Serviço
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-caption uppercase tracking-wide text-text-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {customer.bookings.map((b: typeof customer.bookings[number]) => (
                  <tr
                    key={b.id}
                    className="border-t border-border-subtle transition-colors duration-150 hover:bg-card-elevated"
                  >
                    <td className="px-5 py-3 text-text">
                      <div>{fmtDateTime(b.startsAt)}</div>
                    </td>
                    <td className="px-5 py-3 text-text">{b.service.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          'inline-flex items-center px-2.5 py-0.5 rounded-pill text-label font-medium ' +
                          (BOOKING_STATUS_CLASS[b.status] ??
                            'bg-card-elevated text-text-muted border border-border-subtle')
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {totalBookings > 10 && (
        <p className="text-caption text-text-muted mt-3">
          Mostrando os 10 mais recentes de {totalBookings} agendamentos no total.
        </p>
      )}
    </main>
  );
}