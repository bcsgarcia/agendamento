import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Users, Check } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatBRL } from '@/lib/helpers';
import { AdminTable } from '@/components/AdminTable';
import { AulaForm } from '../AulaForm';
import { InscricaoActions } from './InscricaoActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Status de pagamento → classes semânticas (dark violet).
const STATUS_PAGAMENTO_CLASS: Record<string, string> = {
  pendente: 'bg-pill-inactive text-text-muted border border-border-default',
  sinal_pago: 'bg-accent-bg text-accent-glow-bright border border-accent/30',
  quitado: 'bg-success/15 text-success border border-success/40',
  cancelado: 'bg-danger/15 text-danger border border-danger/40',
};

function PagamentoBadge({ status }: { status: string }) {
  return (
    <span
      className={
        'inline-flex items-center px-2.5 py-0.5 rounded-pill text-label font-medium ' +
        (STATUS_PAGAMENTO_CLASS[status] ?? 'bg-card-elevated text-text-muted border border-border-subtle')
      }
    >
      {status}
    </span>
  );
}

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
      <Link
        href={`/admin/cursos/${aula.course.id}`}
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para {aula.course.name}
      </Link>

      <div className="mt-2 mb-6">
        <div className="text-caption text-text-muted">
          <Link
            href={`/admin/cursos/${aula.course.id}`}
            className="hover:text-accent transition-colors duration-150"
          >
            {aula.course.name}
          </Link>
        </div>
        <h1 className="text-h1 text-text font-semibold mt-1">Aula</h1>
        <div className="text-body text-text-muted mt-1">
          {fmtDateTime(aula.dataInicio)} → {fmtTime(aula.dataFim)}
          {aula.local && <> · {aula.local}</>}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap items-center">
          <span
            className={
              'inline-flex items-center px-2.5 py-0.5 rounded-pill text-label font-medium ' +
              (STATUS_PAGAMENTO_CLASS[aula.status] ?? 'bg-card-elevated text-text-muted border border-border-subtle')
            }
          >
            {aula.status}
          </span>
          {max != null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-label font-medium bg-pill-inactive text-text-muted border border-border-default">
              <Users className="w-3 h-3" aria-hidden="true" />
              {inscricoesAtivas}/{max} vagas
            </span>
          )}
        </div>
      </div>

      {/* Detalhes da aula + form de editar inline (colapsável dark) */}
      <details className="mb-6 bg-card border border-border-subtle rounded-card shadow-card overflow-hidden">
        <summary className="cursor-pointer px-5 py-4 flex items-center justify-between text-body font-medium text-text hover:bg-card-elevated transition-colors duration-150 list-none [&::-webkit-details-marker]:hidden">
          <span>Editar dados da aula</span>
          <ChevronDown className="w-4 h-4 text-text-muted transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="p-5 border-t border-border-subtle">
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

      <h2 className="text-h2 text-text font-medium mb-3">Inscritos ({rows.length})</h2>

      <AdminTable<InscricaoRow>
        rows={rows}
        rowKey={(r) => r.id}
        emptyMessage="Nenhum inscrito nesta aula."
        newHref={`/admin/aulas/${aula.id}/inscricoes/nova`}
        newLabel="+ Adicionar inscrito"
        columns={[
          {
            key: 'nome',
            header: 'Nome',
            render: (r) => (
              <div>
                <div className="font-medium text-text">{r.nomeInscrito}</div>
                {r.email && <div className="text-caption text-text-muted">{r.email}</div>}
              </div>
            ),
          },
          {
            key: 'tel',
            header: 'Telefone',
            render: (r) =>
              r.telefone ? (
                <span className="text-text">{r.telefone}</span>
              ) : (
                <span className="text-text-muted">—</span>
              ),
          },
          {
            key: 'pago',
            header: 'Pago',
            render: (r) =>
              r.valorPago != null ? (
                <span className="font-mono text-body text-text">{formatBRL(r.valorPago)}</span>
              ) : (
                <span className="text-text-muted">—</span>
              ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => (
              <div className="flex flex-col gap-1 items-start">
                <PagamentoBadge status={r.statusPagamento} />
                {r.sinalPago && r.statusPagamento !== 'quitado' && (
                  <span className="inline-flex items-center gap-1 text-caption text-accent-glow-bright">
                    <Check className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
                    sinal
                  </span>
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
