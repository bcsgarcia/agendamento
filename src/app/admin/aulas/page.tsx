import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { prisma } from '@/lib/db';
import { AdminTable } from '@/components/AdminTable';
import { NovaAulaDropdown } from './NovaAulaDropdown';

// Status de aula → classe semântica (mesmo padrão do /admin/cursos/[id]).
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

type AulaRow = {
  id: string;
  dataInicio: Date;
  dataFim: Date;
  status: string;
  vagasOcupadas: number;
  maxAlunos: number | null;
  local: string | null;
  courseId: string;
  courseName: string;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AulasPage() {
  // Busca TODAS as aulas de TODOS os cursos + cursos ativos (pra dropdown
  // "+ Nova aula" — criar aula exige courseId, então o user escolhe o curso
  // antes de cair no /admin/cursos/[id]/aulas/nova).
  const [aulas, cursos] = await Promise.all([
    prisma.aula.findMany({
      orderBy: [{ dataInicio: 'desc' }],
      include: { course: { select: { id: true, name: true, maxAlunos: true } } },
    }),
    prisma.course.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const rows: AulaRow[] = aulas.map((a) => ({
    id: a.id,
    dataInicio: a.dataInicio,
    dataFim: a.dataFim,
    status: a.status,
    vagasOcupadas: a.vagasOcupadas,
    // Aula.maxAlunos (override) tem precedência sobre Course.maxAlunos (default).
    maxAlunos: a.maxAlunos ?? a.course.maxAlunos,
    local: a.local,
    courseId: a.courseId,
    courseName: a.course.name,
  }));

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="flex items-center gap-3 mt-2 mb-2">
        <GraduationCap
          className="w-6 h-6 text-accent"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <h1 className="text-h1 text-text font-semibold">Aulas</h1>
      </div>
      <p className="text-body text-text-muted mb-6">
        Todas as aulas agendadas, de todos os cursos. Clique numa aula para ver
        detalhes, gerenciar inscritos ou adicionar inscrições.
      </p>

      <AdminTable<AulaRow>
        rows={rows}
        rowKey={(r) => r.id}
        // Dropdown "+ Nova aula" aparece no header E no empty state
        // (AdminTable repassa `actions` pra EmptyState automaticamente).
        actions={<NovaAulaDropdown cursos={cursos} />}
        emptyMessage="Nenhuma aula cadastrada ainda. Crie aulas a partir de um curso existente."
        columns={[
          {
            key: 'curso',
            header: 'Curso',
            render: (r) => (
              <Link
                href={`/admin/cursos/${r.courseId}`}
                className="text-accent hover:text-accent-hover transition-colors duration-150 font-medium"
              >
                {r.courseName}
              </Link>
            ),
          },
          {
            key: 'data',
            header: 'Data',
            render: (r) => (
              <div>
                <div className="text-body text-text">
                  {new Date(r.dataInicio).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-caption text-text-muted">
                  {new Date(r.dataInicio).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' – '}
                  {new Date(r.dataFim).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ),
          },
          {
            key: 'vagas',
            header: 'Vagas',
            render: (r) => {
              const max = r.maxAlunos ?? '∞';
              const lotada = r.status === 'lotada';
              const cor = lotada ? 'text-danger' : 'text-text';
              return (
                <span className={`text-body font-mono ${cor}`}>
                  {r.vagasOcupadas}/{max}
                </span>
              );
            },
          },
          {
            key: 'local',
            header: 'Local',
            render: (r) =>
              r.local ? (
                <span className="text-body text-text-muted">{r.local}</span>
              ) : (
                <span className="text-caption text-text-muted">—</span>
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
              <Link
                href={`/admin/aulas/${r.id}`}
                className="text-caption font-medium px-2.5 py-1 border border-border-subtle bg-card text-text rounded-[10px] hover:bg-card-elevated transition-colors duration-150"
              >
                Abrir
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}