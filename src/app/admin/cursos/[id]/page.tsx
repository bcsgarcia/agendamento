import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatBRL } from '@/lib/helpers';
import { AdminTable } from '@/components/AdminTable';
import { CancelAulaButton } from './CancelAulaButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AulaRow = {
  id: string;
  dataInicio: Date;
  dataFim: Date;
  local: string | null;
  vagasOcupadas: number;
  maxAlunos: number | null;
  status: string;
};

export default async function CursoDetalhePage({ params }: { params: { id: string } }) {
  const curso = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      aulas: {
        orderBy: { dataInicio: 'asc' },
      },
    },
  });

  if (!curso) notFound();

  const rows: AulaRow[] = curso.aulas.map((a) => ({
    id: a.id,
    dataInicio: a.dataInicio,
    dataFim: a.dataFim,
    local: a.local,
    vagasOcupadas: a.vagasOcupadas,
    maxAlunos: curso.maxAlunos,
    status: a.status,
  }));

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: Date) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      aberta: 'bg-blue-100 text-blue-800',
      lotada: 'bg-yellow-100 text-yellow-800',
      cancelada: 'bg-red-100 text-red-800',
      concluida: 'bg-gray-200 text-gray-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${map[s] ?? 'bg-gray-100 text-gray-700'}`}>
        {s}
      </span>
    );
  };

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <a href="/admin/cursos" className="text-sm text-blue-600">← Voltar para cursos</a>

      <div className="flex justify-between items-start mt-2 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{curso.name}</h1>
          <div className="text-sm text-gray-500 font-mono mt-1">{curso.slug}</div>
          <div className="flex gap-2 mt-2 text-sm">
            {curso.active ? (
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">ativo</span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700">inativo</span>
            )}
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{curso.modality}</span>
          </div>
        </div>
        <Link
          href={`/admin/cursos/${curso.id}/editar`}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
        >
          Editar curso
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-xs text-gray-500">Preço</div>
          <div className="text-lg font-semibold mt-1">{formatBRL(curso.priceCents)}</div>
        </div>
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-xs text-gray-500">Carga horária</div>
          <div className="text-lg font-semibold mt-1">{curso.cargaHorariaHoras ? `${curso.cargaHorariaHoras}h` : '—'}</div>
        </div>
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-xs text-gray-500">Max alunos/aula</div>
          <div className="text-lg font-semibold mt-1">{curso.maxAlunos ?? '—'}</div>
        </div>
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-xs text-gray-500">Total de aulas</div>
          <div className="text-lg font-semibold mt-1">{curso.aulas.length}</div>
        </div>
      </div>

      {curso.description && (
        <div className="mb-8 p-4 bg-white border rounded-lg">
          <h2 className="font-semibold mb-2">Descrição</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{curso.description}</p>
        </div>
      )}

      {curso.formaPagamento && (
        <div className="mb-8 p-4 bg-white border rounded-lg">
          <h2 className="font-semibold mb-2">Forma de pagamento</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{curso.formaPagamento}</p>
        </div>
      )}

      {curso.purchaseUrl && (
        <div className="mb-8 p-4 bg-white border rounded-lg">
          <h2 className="font-semibold mb-2">Link de pagamento</h2>
          <a href={curso.purchaseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline">
            {curso.purchaseUrl}
          </a>
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Aulas</h2>
        <Link
          href={`/admin/cursos/${curso.id}/aulas/nova`}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nova aula
        </Link>
      </div>

      <AdminTable<AulaRow>
        rows={rows}
        rowKey={(r) => r.id}
        emptyMessage="Nenhuma aula cadastrada. Clique em '+ Nova aula' para criar a primeira."
        columns={[
          {
            key: 'data',
            header: 'Início',
            render: (r) => (
              <div>
                <div>{fmtDate(r.dataInicio)}</div>
                <div className="text-xs text-gray-500 font-mono">{fmtTime(r.dataInicio)}</div>
              </div>
            ),
          },
          {
            key: 'fim',
            header: 'Fim',
            render: (r) => (
              <div>
                <div>{fmtDate(r.dataFim)}</div>
                <div className="text-xs text-gray-500 font-mono">{fmtTime(r.dataFim)}</div>
              </div>
            ),
          },
          {
            key: 'local',
            header: 'Local',
            render: (r) => r.local ?? <span className="text-gray-400">—</span>,
          },
          {
            key: 'vagas',
            header: 'Vagas',
            render: (r) =>
              r.maxAlunos != null ? (
                <span>
                  <span className="font-mono">{r.vagasOcupadas}</span>
                  <span className="text-gray-500"> / {r.maxAlunos}</span>
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => statusBadge(r.status),
          },
          {
            key: 'actions',
            header: 'Ações',
            className: 'text-right',
            render: (r) => (
              <div className="flex justify-end gap-2">
                <Link
                  href={`/admin/aulas/${r.id}`}
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                >
                  Ver / Editar
                </Link>
                {r.status !== 'cancelada' && r.status !== 'concluida' && (
                  <CancelAulaButton id={r.id} />
                )}
              </div>
            ),
          },
        ]}
      />
    </main>
  );
}