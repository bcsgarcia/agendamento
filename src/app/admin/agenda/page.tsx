import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatEUR } from '@/lib/helpers';
import { AdminTable } from '@/components/AdminTable';
import { Pill } from '@/components/ui/Pill';
import { DeleteBookingButton } from './DeleteBookingButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Status de booking → Pill variants + label PT-BR.
// "no_show" tratado como inactive (estado terminal, sem ação).
const STATUS_PILL: Record<string, { variant: 'active' | 'inactive'; label: string }> = {
  scheduled: { variant: 'active', label: 'agendado' },
  confirmed: { variant: 'active', label: 'confirmado' },
  completed: { variant: 'inactive', label: 'concluído' },
  cancelled: { variant: 'inactive', label: 'cancelado' },
  no_show: { variant: 'inactive', label: 'não compareceu' },
};

type BookingRow = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  customerName: string;
  customerLabel: string;
  serviceName: string;
  servicePriceCents: number;
};

export default async function AgendaPage() {
  const bookings = await prisma.booking.findMany({
    include: { customer: true, service: true },
    orderBy: { startsAt: 'asc' },
    take: 100,
  });

  const rows: BookingRow[] = bookings.map((b) => {
    const customerName = b.customer.name || 'sem nome';
    return {
      id: b.id,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      status: b.status,
      customerName,
      // Pra desambiguar no botão "Excluir" (alinhado com o pattern do
      // DeactivateCursoButton que usa o nome do curso no confirm).
      customerLabel: b.customer.name || b.customer.phone,
      serviceName: b.service.name,
      servicePriceCents: b.service.priceCents,
    };
  });

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="flex items-center gap-3 mt-2 mb-2">
        <CalendarDays className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <h1 className="text-h1 text-text font-semibold">Agenda</h1>
      </div>
      <p className="text-body text-text-muted mb-6">
        Todos os bookings (agendamentos) de clientes. Clique em "Ver" pra abrir o
        detalhe ou editar datas/status.
      </p>

      <AdminTable<BookingRow>
        rows={rows}
        rowKey={(r) => r.id}
        newHref="/admin/agenda/novo"
        newLabel="+ Novo booking"
        emptyMessage="Nenhum booking cadastrado ainda. Clique em '+ Novo booking' para criar o primeiro."
        columns={[
          {
            key: 'data',
            header: 'Data/Hora',
            render: (r) => (
              <div>
                <div className="text-body text-text">
                  {r.startsAt.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-caption text-text-muted font-mono">
                  {r.startsAt.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' – '}
                  {r.endsAt.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ),
          },
          {
            key: 'cliente',
            header: 'Cliente',
            render: (r) => (
              <div>
                <div className="text-body text-text font-medium">{r.customerName}</div>
                <div className="text-caption text-text-muted">ver detalhe no perfil do cliente</div>
              </div>
            ),
          },
          {
            key: 'servico',
            header: 'Serviço',
            render: (r) => (
              <div>
                <div className="text-body text-text">{r.serviceName}</div>
                <div className="text-caption text-text-muted font-mono">
                  {formatEUR(r.servicePriceCents)}
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => {
              const status = STATUS_PILL[r.status] ?? STATUS_PILL.completed!;
              return <Pill variant={status.variant}>{status.label}</Pill>;
            },
          },
          {
            key: 'actions',
            header: 'Ações',
            className: 'text-right',
            render: (r) => (
              <div className="flex justify-end gap-2">
                <Link
                  href={`/admin/agenda/${r.id}`}
                  className="text-caption font-medium px-2.5 py-1 border border-border-subtle bg-card text-text rounded-[10px] hover:bg-card-elevated transition-colors duration-150"
                >
                  Ver
                </Link>
                <Link
                  href={`/admin/agenda/${r.id}/editar`}
                  className="text-caption font-medium px-2.5 py-1 border border-border-subtle bg-card text-text rounded-[10px] hover:bg-card-elevated transition-colors duration-150"
                >
                  Editar
                </Link>
                <DeleteBookingButton id={r.id} customerLabel={r.customerLabel} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
