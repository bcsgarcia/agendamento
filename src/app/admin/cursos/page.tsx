import { prisma } from '@/lib/db';
import { formatBRL } from '@/lib/helpers';
import { AdminTable } from '@/components/AdminTable';
import { DeactivateCursoButton } from './DeactivateCursoButton';
import Link from 'next/link';

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
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href="/admin" className="text-sm text-blue-600">← Voltar</a>
          <h1 className="text-3xl font-bold mt-2">Cursos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Catálogo de cursos e formações. Cursos inativos ficam ocultos da vitrine pública.
          </p>
        </div>
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
                  className="font-medium text-blue-600 hover:underline"
                >
                  {r.name}
                </Link>
                <div className="text-xs text-gray-500 font-mono">{r.slug}</div>
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
                <div className="text-xs text-gray-700 max-w-xs truncate" title={r.formaPagamento}>
                  {r.formaPagamento}
                </div>
              ) : (
                <span className="text-gray-400 text-xs">—</span>
              ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) =>
              r.active ? (
                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">ativo</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">inativo</span>
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
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                >
                  Editar
                </Link>
                {r.active && (
                  <DeactivateCursoButton id={r.id} name={r.name} />
                )}
              </div>
            ),
          },
        ]}
      />
    </main>
  );
}