import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatBRL } from '@/lib/helpers';
import { AdminTable } from '@/components/AdminTable';
import { Pill } from '@/components/ui/Pill';
import { DeactivateCursoButton } from './DeactivateCursoButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CursoRow = {
  id: string;
  slug: string;
  name: string;
  cargaHorariaHoras: number | null;
  maxAlunos: number | null;
  priceCents: number;
  formaPagamento: string | null;
  active: boolean;
  _count: { aulas: number };
};

export default async function CursosPage() {
  const cursos = await prisma.course.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { aulas: true } } },
  });

  const rows: CursoRow[] = cursos.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    cargaHorariaHoras: c.cargaHorariaHoras,
    maxAlunos: c.maxAlunos,
    priceCents: c.priceCents,
    formaPagamento: c.formaPagamento,
    active: c.active,
    _count: { aulas: c._count.aulas },
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
        <h1 className="text-h1 text-text font-semibold">Cursos</h1>
        <p className="text-body text-text-muted mt-1">
          Catálogo de cursos e formações. Cursos inativos ficam ocultos da vitrine pública.
        </p>
      </div>

      <AdminTable<CursoRow>
        rows={rows}
        rowKey={(r) => r.id}
        newHref="/admin/cursos/novo"
        newLabel="+ Novo curso"
        emptyMessage="Nenhum curso cadastrado ainda. Clique em '+ Novo curso' para começar."
        columns={[
          {
            key: 'name',
            header: 'Nome',
            render: (r) => (
              <div>
                <Link
                  href={`/admin/cursos/${r.id}`}
                  className="font-medium text-accent hover:text-accent-hover transition-colors duration-150"
                >
                  {r.name}
                </Link>
                <div className="text-caption text-text-muted font-mono mt-0.5">{r.slug}</div>
              </div>
            ),
          },
          {
            key: 'carga',
            header: 'Carga',
            render: (r) => (r.cargaHorariaHoras ? `${r.cargaHorariaHoras}h` : '—'),
          },
          {
            key: 'max',
            header: 'Max alunos',
            render: (r) => r.maxAlunos ?? '—',
          },
          {
            key: 'price',
            header: 'Preço',
            render: (r) => formatBRL(r.priceCents),
          },
          {
            key: 'aulas',
            header: 'Aulas',
            render: (r) => `${r._count.aulas}`,
          },
          {
            key: 'pagto',
            header: 'Pagamento',
            render: (r) =>
              r.formaPagamento ? (
                <div
                  className="text-caption text-text-muted max-w-xs truncate"
                  title={r.formaPagamento}
                >
                  {r.formaPagamento}
                </div>
              ) : (
                <span className="text-caption text-text-muted">—</span>
              ),
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
              <div className="flex justify-end gap-2">
                <Link
                  href={`/admin/cursos/${r.id}/editar`}
                  className="text-caption font-medium px-2.5 py-1 border border-border-subtle bg-card text-text rounded-[10px] hover:bg-card-elevated transition-colors duration-150"
                >
                  Editar
                </Link>
                {r.active && <DeactivateCursoButton id={r.id} name={r.name} />}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
