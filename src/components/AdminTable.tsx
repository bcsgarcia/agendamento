// Tabela admin reutilizável: loading/empty state, header com link "Novo"
// Visual: Dark Violet (PR-1 tokens). Server Component — zero JS no client.
//
// Uso:
//   <AdminTable<Row>
//     rows={rows}
//     columns={columns}
//     rowKey={(r) => r.id}
//     newHref="/admin/cursos/novo"
//     newLabel="+ Novo curso"
//     emptyMessage="Nenhum curso cadastrado ainda."
//   />
//
// Slot custom de ações no header (substitui newHref/newLabel se fornecido):
//   <AdminTable actions={<Button>Exportar</Button>} ... />
import Link from 'next/link';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  newHref?: string;
  newLabel?: string;
  rowKey: (row: T) => string;
  /**
   * Slot de ações no header (ex: botão "Exportar"). Se fornecido, sobrescreve
   * newHref/newLabel. Default: null (sem slot).
   */
  actions?: ReactNode;
};

export function AdminTable<T>({
  rows,
  columns,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  newHref,
  newLabel = '+ Novo',
  rowKey,
  actions,
}: Props<T>) {
  // Header counter: loading, vazio, ou contagem.
  const counterText = loading
    ? 'Carregando…'
    : `${rows.length} registro${rows.length === 1 ? '' : 's'}`;

  // Slot de ações no header: se o caller passou `actions`, ele tem prioridade
  // sobre `newHref`/`newLabel` (slot custom sempre vence). Se não passou,
  // renderiza o botão "+ Novo" quando newHref existe.
  const headerActions =
    actions !== undefined ? (
      actions
    ) : newHref ? (
      <Link
        href={newHref}
        className="text-label font-medium px-3 py-1.5 bg-accent text-white rounded-pill hover:bg-accent-hover transition-colors duration-150"
      >
        {newLabel}
      </Link>
    ) : null;

  return (
    <div className="bg-card border border-border-subtle rounded-card overflow-hidden shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border-subtle bg-card-elevated">
        <span className="text-caption uppercase tracking-wide text-text-muted">
          {counterText}
        </span>
        <div className="flex items-center gap-2 self-end sm:self-auto">{headerActions}</div>
      </div>

      {/* Body: loading / empty / table */}
      {loading ? (
        <TableSkeleton columns={columns.length} />
      ) : rows.length === 0 ? (
        <EmptyState actions={headerActions} message={emptyMessage} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-card-elevated">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={
                      'text-left px-5 py-3 font-medium text-caption uppercase tracking-wide text-text-muted ' +
                      (c.className ?? '')
                    }
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-t border-border-subtle transition-colors duration-150 hover:bg-card-elevated"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={'px-5 py-3 text-text ' + (c.className ?? '')}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-componentes internos (privados ao arquivo) ---------- */

function EmptyState({
  message,
  actions,
}: {
  message: string;
  actions: ReactNode;
}) {
  return (
    <div className="px-5 py-12 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-card bg-card-elevated border border-border-subtle flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6 text-text-muted" aria-hidden="true" />
      </div>
      <p className="text-body text-text-muted max-w-sm">{message}</p>
      {actions ? <div className="mt-4">{actions}</div> : null}
    </div>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  // 5 linhas placeholder com larguras variadas para parecer "real".
  const widths = ['w-3/4', 'w-2/3', 'w-4/5', 'w-1/2', 'w-3/5'];
  const rowCount = 5;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body" role="status" aria-busy="true">
        <thead className="bg-card-elevated">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="text-left px-5 py-3">
                <span className="block h-3 w-24 rounded-pill bg-card animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, r) => (
            <tr key={r} className="border-t border-border-subtle">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-5 py-3">
                  <span
                    className={
                      'block h-3 rounded-pill bg-card-elevated animate-pulse ' +
                      widths[c % widths.length]
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
