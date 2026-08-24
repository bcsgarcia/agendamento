import Link from 'next/link';
import { Clock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatEUR } from '@/lib/helpers';
import { getCurrentUser } from '@/lib/auth';
import { canEditInAdmin, type Role } from '@/lib/permissions';
import { AdminTable } from '@/components/AdminTable';
import { Pill } from '@/components/ui/Pill';
import { DeleteServiceButton } from './DeleteServiceButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ServicoRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
};

export default async function ServicosPage() {
  const actor = await getCurrentUser();
  const canEdit = actor ? canEditInAdmin(actor.role as Role) : true;

  const services = await prisma.service.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  });

  const rows: ServicoRow[] = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    durationMin: s.durationMin,
    priceCents: s.priceCents,
    active: s.active,
  }));

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="mt-2 mb-6">
        <h1 className="text-h1 text-text font-semibold">Serviços</h1>
        <p className="text-body text-text-muted mt-1">
          Catálogo de serviços oferecidos. Serviços inativos ficam ocultos para clientes.
        </p>
      </div>

      <AdminTable<ServicoRow>
        rows={rows}
        rowKey={(r) => r.id}
        newHref="/admin/servicos/novo"
        newLabel="+ Novo serviço"
        canCreate={canEdit}
        emptyMessage="Nenhum serviço cadastrado ainda. Clique em '+ Novo serviço' para começar."
        columns={[
          {
            key: 'name',
            header: 'Nome',
            render: (r) => (
              <div>
                <Link
                  href={`/admin/servicos/${r.id}`}
                  className="font-medium text-accent hover:text-accent-hover transition-colors duration-150"
                >
                  {r.name}
                </Link>
                <div className="text-caption text-text-muted font-mono mt-0.5">
                  {r.slug}
                </div>
              </div>
            ),
          },
          {
            key: 'description',
            header: 'Descrição',
            render: (r) => (
              <div className="text-caption text-text-muted max-w-xs truncate" title={r.description}>
                {r.description}
              </div>
            ),
          },
          {
            key: 'duration',
            header: 'Duração',
            render: (r) => (
              <span className="inline-flex items-center gap-1.5 text-caption text-text">
                <Clock className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                {r.durationMin} min
              </span>
            ),
          },
          {
            key: 'price',
            header: 'Preço',
            render: (r) => formatEUR(r.priceCents),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) =>
              r.active ? (
                <Pill variant="active">ativo</Pill>
              ) : (
                <Pill variant="inactive">inativo</Pill>
              ),
          },
          {
            key: 'actions',
            header: 'Ações',
            className: 'text-right',
            render: (r) => (
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                {canEdit && (
                  <>
                    <Link
                      href={`/admin/servicos/${r.id}/editar`}
                      className="text-caption font-medium px-2.5 py-1 border border-border-subtle bg-card text-text rounded-[10px] hover:bg-card-elevated transition-colors duration-150"
                    >
                      Editar
                    </Link>
                    <DeleteServiceButton id={r.id} name={r.name} />
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
