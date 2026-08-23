// Tabela admin reutilizável: loading/empty state, header com link "Novo"
// Usada nas listagens de cursos/aulas/inscricoes
import Link from 'next/link';

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
};

export function AdminTable<T>({
  rows,
  columns,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  newHref,
  newLabel = '+ Novo',
  rowKey,
}: Props<T>) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
        <span className="text-sm text-gray-600">
          {loading ? 'Carregando…' : `${rows.length} registro${rows.length === 1 ? '' : 's'}`}
        </span>
        {newHref && (
          <Link
            href={newHref}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {newLabel}
          </Link>
        )}
      </div>

      {!loading && rows.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={'text-left px-4 py-2 font-medium text-gray-700 ' + (c.className ?? '')}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={rowKey(row)} className="border-b last:border-b-0 hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className={'px-4 py-2 ' + (c.className ?? '')}>
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