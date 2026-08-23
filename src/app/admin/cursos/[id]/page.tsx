import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, GraduationCap, TrendingUp, Activity } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatEUR } from '@/lib/helpers';
import { AdminTable } from '@/components/AdminTable';
import { Card, StatTile, Pill } from '@/components/ui';
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

// Mapeamento de status de aula → classes semânticas (dark violet).
// Mantém a leitura rápida mas adota os tokens do redesign.
const AULA_STATUS_CLASS: Record<string, string> = {
  aberta: 'bg-accent-bg text-accent-glow-bright border border-accent/30',
  lotada: 'bg-pill-inactive text-text border border-border-default',
  cancelada: 'bg-danger/15 text-danger border border-danger/40',
  concluida: 'bg-card-elevated text-text-muted border border-border-subtle',
};

function AulaStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={
        'inline-flex items-center px-2.5 py-0.5 rounded-pill text-label font-medium ' +
        (AULA_STATUS_CLASS[status] ?? 'bg-card-elevated text-text-muted border border-border-subtle')
      }
    >
      {status}
    </span>
  );
}

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

  // Alunos inscritos = total de inscrições ativas em todas as aulas do curso.
  // Mantém equivalência com `Aula.vagasOcupadas` (atualizado por `recalcAulaVagas`
  // sempre que inscrições mudam — ver src/lib/course-helpers.ts).
  const totalAlunosInscritos = curso.aulas.reduce<number>(
    (sum, a) => sum + a.vagasOcupadas,
    0,
  );
  // Receita estimada = preço do curso × número de inscritos ativos.
  const receitaEstimadaCents = curso.priceCents * totalAlunosInscritos;

  const rows: AulaRow[] = curso.aulas.map((a) => ({
    id: a.id,
    dataInicio: a.dataInicio,
    dataFim: a.dataFim,
    local: a.local,
    vagasOcupadas: a.vagasOcupadas,
    // Aula.maxAlunos sobrepõe o default do curso quando preenchido.
    maxAlunos: a.maxAlunos ?? curso.maxAlunos,
    status: a.status,
  }));

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: Date) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Status do curso é binário (ativo/inativo) — Pill serve bem aqui.
  const cursoStatusPill = curso.active ? (
    <Pill variant="active">ativo</Pill>
  ) : (
    <Pill variant="inactive">inativo</Pill>
  );

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <Link
        href="/admin/cursos"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para cursos
      </Link>

      <div className="flex justify-between items-start mt-2 mb-6">
        <div className="min-w-0">
          <h1 className="text-h1 text-text font-semibold">{curso.name}</h1>
          <div className="text-caption text-text-muted font-mono mt-1">{curso.slug}</div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {cursoStatusPill}
            <Pill variant="inactive">{curso.modality}</Pill>
          </div>
        </div>
        <Link
          href={`/admin/cursos/${curso.id}/editar`}
          className="px-4 py-2 rounded-card text-label font-medium border border-border-subtle bg-card text-text hover:bg-card-elevated transition-colors duration-150"
        >
          Editar curso
        </Link>
      </div>

      {/* 4 StatTiles — spec PR-5 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile
          label="Total Aulas"
          value={curso.aulas.length}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatTile
          label="Alunos Inscritos"
          value={totalAlunosInscritos}
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatTile
          label="Receita Estimada"
          value={formatEUR(receitaEstimadaCents)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatTile
          label="Status"
          value={cursoStatusPill}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Detalhes do curso — info secundária em Card */}
      <Card className="mb-8">
        <h2 className="text-h2 text-text font-medium mb-4">Detalhes do curso</h2>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body">
          <div>
            <dt className="text-caption uppercase tracking-wide text-text-muted">Preço</dt>
            <dd className="text-text font-mono mt-1">{formatEUR(curso.priceCents)}</dd>
          </div>
          <div>
            <dt className="text-caption uppercase tracking-wide text-text-muted">Carga horária</dt>
            <dd className="text-text mt-1">
              {curso.cargaHorariaHoras ? `${curso.cargaHorariaHoras}h` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-caption uppercase tracking-wide text-text-muted">Max alunos/aula</dt>
            <dd className="text-text mt-1">{curso.maxAlunos ?? '—'}</dd>
          </div>
        </dl>
      </Card>

      {curso.description && (
        <Card className="mb-8">
          <h2 className="text-h2 text-text font-medium mb-2">Descrição</h2>
          <p className="text-body text-text-muted whitespace-pre-wrap">{curso.description}</p>
        </Card>
      )}

      {curso.formaPagamento && (
        <Card className="mb-8">
          <h2 className="text-h2 text-text font-medium mb-2">Forma de pagamento</h2>
          <p className="text-body text-text-muted whitespace-pre-wrap">{curso.formaPagamento}</p>
        </Card>
      )}

      {curso.purchaseUrl && (
        <Card className="mb-8">
          <h2 className="text-h2 text-text font-medium mb-2">Link de pagamento</h2>
          <a
            href={curso.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body text-accent hover:text-accent-hover underline transition-colors duration-150 break-all"
          >
            {curso.purchaseUrl}
          </a>
        </Card>
      )}

      <h2 className="text-h2 text-text font-medium mb-3">Aulas</h2>

      <AdminTable<AulaRow>
        rows={rows}
        rowKey={(r) => r.id}
        emptyMessage="Nenhuma aula cadastrada. Clique em '+ Nova aula' para criar a primeira."
        newHref={`/admin/cursos/${curso.id}/aulas/nova`}
        newLabel="+ Nova aula"
        columns={[
          {
            key: 'data',
            header: 'Início',
            render: (r) => (
              <div>
                <div className="text-text">{fmtDate(r.dataInicio)}</div>
                <div className="text-caption text-text-muted font-mono">{fmtTime(r.dataInicio)}</div>
              </div>
            ),
          },
          {
            key: 'fim',
            header: 'Fim',
            render: (r) => (
              <div>
                <div className="text-text">{fmtDate(r.dataFim)}</div>
                <div className="text-caption text-text-muted font-mono">{fmtTime(r.dataFim)}</div>
              </div>
            ),
          },
          {
            key: 'local',
            header: 'Local',
            render: (r) => r.local ?? <span className="text-text-muted">—</span>,
          },
          {
            key: 'vagas',
            header: 'Vagas',
            render: (r) =>
              r.maxAlunos != null ? (
                <span className="text-text">
                  <span className="font-mono">{r.vagasOcupadas}</span>
                  <span className="text-text-muted"> / {r.maxAlunos}</span>
                </span>
              ) : (
                <span className="text-text-muted">—</span>
              ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => <AulaStatusBadge status={r.status} />,
          },
          {
            key: 'actions',
            header: 'Ações',
            className: 'text-right',
            render: (r) => (
              <div className="flex justify-end gap-2">
                <Link
                  href={`/admin/aulas/${r.id}`}
                  className="text-label px-2.5 py-1 border border-border-subtle rounded-card bg-card text-text hover:bg-card-elevated transition-colors duration-150"
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
