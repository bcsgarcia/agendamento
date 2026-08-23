import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Calendar, TrendingUp, Activity } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatEUR } from '@/lib/helpers';
import { AdminTable } from '@/components/AdminTable';
import { Card, StatTile, Pill } from '@/components/ui';
import { DeleteServiceButton } from '../DeleteServiceButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type BookingRow = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  customerName: string | null;
  customerPhone: string;
};

export default async function ServicoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const servico = await prisma.service.findUnique({
    where: { id: params.id },
    include: {
      bookings: {
        orderBy: { startsAt: 'desc' },
        take: 10,
        include: {
          customer: { select: { name: true, phone: true } },
        },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!servico) notFound();

  const rows: BookingRow[] = servico.bookings.map((b) => ({
    id: b.id,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    status: b.status,
    customerName: b.customer.name,
    customerPhone: b.customer.phone,
  }));

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  const fmtTime = (d: Date) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const statusPill = servico.active ? (
    <Pill variant="active">ativo</Pill>
  ) : (
    <Pill variant="inactive">inativo</Pill>
  );

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <Link
        href="/admin/servicos"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para serviços
      </Link>

      <div className="flex justify-between items-start mt-2 mb-6 gap-4">
        <div className="min-w-0">
          <h1 className="text-h1 text-text font-semibold">{servico.name}</h1>
          <div className="text-caption text-text-muted font-mono mt-1">
            {servico.slug}
          </div>
          <div className="mt-3">{statusPill}</div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/admin/servicos/${servico.id}/editar`}
            className="px-4 py-2 rounded-card text-label font-medium border border-border-subtle bg-card text-text hover:bg-card-elevated transition-colors duration-150"
          >
            Editar serviço
          </Link>
          <DeleteServiceButton id={servico.id} name={servico.name} />
        </div>
      </div>

      {/* StatTiles — KPI rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <StatTile
          label="Duração"
          value={`${servico.durationMin} min`}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatTile
          label="Preço"
          value={formatEUR(servico.priceCents)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatTile
          label="Agendamentos"
          value={servico._count.bookings}
          icon={<Calendar className="w-5 h-5" />}
        />
      </div>

      <Card className="mb-8">
        <h2 className="text-h2 text-text font-medium mb-2">Descrição</h2>
        <p className="text-body text-text-muted whitespace-pre-wrap">
          {servico.description}
        </p>
      </Card>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-text-muted" strokeWidth={2} aria-hidden="true" />
          <h2 className="text-h2 text-text font-medium">
            Últimos agendamentos ({servico._count.bookings} total)
          </h2>
        </div>

        {rows.length === 0 ? (
          <Card>
            <p className="text-body text-text-muted text-center py-6">
              Nenhum agendamento usa este serviço ainda.
            </p>
          </Card>
        ) : (
          <AdminTable<BookingRow>
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage="Nenhum agendamento."
            columns={[
              {
                key: 'when',
                header: 'Quando',
                render: (r) => (
                  <div>
                    <div className="text-body text-text">{fmtDate(r.startsAt)}</div>
                    <div className="text-caption text-text-muted font-mono">
                      {fmtTime(r.startsAt)} – {fmtTime(r.endsAt)}
                    </div>
                  </div>
                ),
              },
              {
                key: 'customer',
                header: 'Cliente',
                render: (r) => (
                  <div>
                    <div className="text-body text-text">
                      {r.customerName ?? <span className="text-text-muted">(sem nome)</span>}
                    </div>
                    <div className="text-caption text-text-muted font-mono">
                      {r.customerPhone}
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <span className="text-caption text-text">{r.status}</span>,
              },
            ]}
          />
        )}
      </div>
    </main>
  );
}
