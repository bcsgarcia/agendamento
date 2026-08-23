import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatBRL } from '@/lib/helpers';
import { AdminTable } from '@/components/AdminTable';
import { AulaForm } from '../AulaForm';
import { InscricaoActions } from './InscricaoActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_PAGAMENTO_BADGE: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  sinal_pago: 'bg-blue-100 text-blue-800',
  quitado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

type InscricaoRow = {
  id: string;
  nomeInscrito: string;
  email: string | null;
  telefone: string | null;
  valorPago: number | null;
  sinalPago: boolean;
  statusPagamento: string;
};

export default async function AulaDetalhePage({ params }: { params: { id: string } }) {
  const aula = await prisma.aula.findUnique({
    where: { id: params.id },
    include: {
      course: true,
      inscricoes: { orderBy: { criadoEm: 'asc' } },
    },
  });

  if (!aula) notFound();

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: Date) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtDateTime = (d: Date) => `${fmtDate(d)} ${fmtTime(d)}`;

  // Form datetime-local precisa YYYY-MM-DDTHH:MM (LOCAL)
  const toLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const rows: InscricaoRow[] = aula.inscricoes.map((i) => ({
    id: i.id,
    nomeInscrito: i.nomeInscrito,
    email: i.email,
    telefone: i.telefone,
    valorPago: i.valorPago,
    sinalPago: i.sinalPago,
    statusPagamento: i.statusPagamento,
  }));

  const inscricoesAtivas = rows.filter((r) => r.statusPagamento !== 'cancelado').length;
  const max = aula.course.maxAlunos;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <a href={`/admin/cursos/${aula.course.id}`} className="text-sm text-blue-600">
        ← Voltar para {aula.course.name}
      </a>

      <div className="mt-2 mb-6">
        <div className="text-sm text-gray-500">
          <Link href={`/admin/cursos/${aula.course.id}`} className="hover:underline">
            {aula.course.name}
          </Link>
        </div>
        <h1 className="text-3xl font-bold mt-1">Aula</h1>
        <div className="text-sm text-gray-600 mt-1">
          {fmtDateTime(aula.dataInicio)} → {fmtTime(aula.dataFim)}
          {aula.local && <> · {aula.local}</>}
        </div>
        <div className="flex gap-2 mt-2 text-sm">
          <span
            className={`px-2 py-0.5 rounded ${
              aula.status === 'aberta'
                ? 'bg-blue-100 text-blue-800'
                : aula.status === 'lotada'
                ? 'bg-yellow-100 text-yellow-800'
                : aula.status === 'cancelada'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {aula.status}
          </span>
          {max != null && (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              {inscricoesAtivas}/{max} vagas
            </span>
          )}
        </div>
      </div>

      {/* Detalhes da aula + form de editar inline */}
      <details className="mb-6 bg-white border rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-sm hover:bg-gray-50">
          Editar dados da aula
        </summary>
        <div className="p-4 border-t">
          <AulaForm
            mode="edit"
            courseId={aula.course.id}
            aulaId={aula.id}
            defaultValues={{
              dataInicio: toLocal(aula.dataInicio),
              dataFim: toLocal(aula.dataFim),
              local: aula.local ?? '',
              maxAlunos: aula.course.maxAlunos,
              status: aula.status,
            }}
            redirectPath="/admin/aulas/{id}"
          />
        </div>
      </details>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Inscritos ({rows.length})</h2>
        <Link
          href={`/admin/aulas/${aula.id}/inscricoes/nova`}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Adicionar inscrito
        </Link>
      </div>

      <AdminTable<InscricaoRow>
        rows={rows}
        rowKey={(r) => r.id}
        emptyMessage="Nenhum inscrito nesta aula."
        columns={[
          {
            key: 'nome',
            header: 'Nome',
            render: (r) => (
              <div>
                <div className="font-medium">{r.nomeInscrito}</div>
                {r.email && <div className="text-xs text-gray-500">{r.email}</div>}
              </div>
            ),
          },
          {
            key: 'tel',
            header: 'Telefone',
            render: (r) => r.telefone ?? <span className="text-gray-400">—</span>,
          },
          {
            key: 'pago',
            header: 'Pago',
            render: (r) =>
              r.valorPago != null ? (
                <span className="font-mono text-sm">{formatBRL(r.valorPago)}</span>
              ) : (
                <span className="text-gray-400">—</span>
              ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => (
              <div className="flex flex-col gap-1 items-start">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    STATUS_PAGAMENTO_BADGE[r.statusPagamento] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {r.statusPagamento}
                </span>
                {r.sinalPago && r.statusPagamento !== 'quitado' && (
                  <span className="text-xs text-blue-600">✓ sinal</span>
                )}
              </div>
            ),
          },
          {
            key: 'actions',
            header: 'Ações',
            className: 'text-right',
            render: (r) => <InscricaoActions id={r.id} currentStatus={r.statusPagamento} />,
          },
        ]}
      />
    </main>
  );
}