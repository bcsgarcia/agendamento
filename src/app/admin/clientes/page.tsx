// Lista de clientes (CRUD: criar/editar/excluir).
// Visual: Dark Violet (PR-1 tokens). Server Component.

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { AdminTable } from '@/components/AdminTable';
import { Pill } from '@/components/ui/Pill';
import { ExcluirClienteButton } from './ExcluirClienteButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ClienteRow = {
  id: string;
  phone: string;
  name: string | null;
  allergies: string | null;
  tags: string[];
  bookingsCount: number;
  lastBookingAt: Date | null;
  createdAt: Date;
};

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function ClientesPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        orderBy: { startsAt: 'desc' },
        take: 1,
        select: { startsAt: true },
      },
    },
  });

  const rows: ClienteRow[] = customers.map((c: typeof customers[number]) => ({
    id: c.id,
    phone: c.phone,
    name: c.name,
    allergies: c.allergies,
    tags: c.tags,
    bookingsCount: c._count.bookings,
    lastBookingAt: c.bookings[0]?.startsAt ?? null,
    createdAt: c.createdAt,
  }));

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar
      </Link>
      <div className="mt-2 mb-6">
        <h1 className="text-h1 text-text font-semibold">Clientes</h1>
        <p className="text-body text-text-muted mt-1">
          Cadastros de clientes com WhatsApp. Cada cliente é identificado pelo
          telefone (único). Tags ajudam a filtrar e agrupar.
        </p>
      </div>

      <AdminTable<ClienteRow>
        rows={rows}
        rowKey={(r) => r.id}
        newHref="/admin/clientes/novo"
        newLabel="+ Novo cliente"
        emptyMessage="Nenhum cliente cadastrado ainda. Clique em '+ Novo cliente' para começar."
        columns={[
          {
            key: 'name',
            header: 'Nome',
            render: (r) => (
              <div className="min-w-0">
                <Link
                  href={`/admin/clientes/${r.id}`}
                  className="text-text font-medium hover:text-accent transition-colors duration-150"
                >
                  {r.name || (
                    <span className="text-text-muted">Sem nome</span>
                  )}
                </Link>
                {r.allergies && (
                  <div className="mt-1 inline-flex items-center gap-1 text-caption text-danger">
                    <AlertTriangle
                      className="w-3 h-3"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span className="truncate max-w-[180px]" title={r.allergies}>
                      {r.allergies}
                    </span>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'phone',
            header: 'Telefone',
            render: (r) => (
              <span className="font-mono text-body text-text">{r.phone}</span>
            ),
          },
          {
            key: 'tags',
            header: 'Tags',
            render: (r) =>
              r.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {r.tags.slice(0, 3).map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                  {r.tags.length > 3 && (
                    <Pill>+{r.tags.length - 3}</Pill>
                  )}
                </div>
              ) : (
                <span className="text-text-muted text-caption">—</span>
              ),
          },
          {
            key: 'lastBooking',
            header: 'Último agendamento',
            render: (r) => (
              <span className="text-body text-text-muted">
                {r.lastBookingAt ? fmtDate(r.lastBookingAt) : '—'}
              </span>
            ),
          },
          {
            key: 'bookings',
            header: 'Total',
            className: 'text-right',
            render: (r) => (
              <span className="font-mono text-body text-text">
                {r.bookingsCount}
              </span>
            ),
          },
          {
            key: 'created',
            header: 'Criado em',
            render: (r) => (
              <span className="text-body text-text-muted">{fmtDate(r.createdAt)}</span>
            ),
          },
          {
            key: 'actions',
            header: 'Ações',
            className: 'text-right',
            render: (r) => (
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Link
                  href={`/admin/clientes/${r.id}`}
                  className="text-label px-2.5 py-1 border border-border-subtle rounded-card bg-card text-text hover:bg-card-elevated transition-colors duration-150"
                >
                  Ver
                </Link>
                <Link
                  href={`/admin/clientes/${r.id}/editar`}
                  className="text-label px-2.5 py-1 border border-border-subtle rounded-card bg-card text-text hover:bg-card-elevated transition-colors duration-150"
                >
                  Editar
                </Link>
                <ExcluirClienteButton
                  id={r.id}
                  name={r.name ?? 'Sem nome'}
                />
              </div>
            ),
          },
        ]}
      />
    </main>
  );
}