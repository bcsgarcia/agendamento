'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateInscricaoAction, deleteInscricaoAction } from '@/lib/course-actions';

const STATUSES = ['pendente', 'sinal_pago', 'quitado', 'cancelado'] as const;

export function InscricaoActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function updateStatus(newStatus: string) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      fd.append('statusPagamento', newStatus);
      const res = await updateInscricaoAction(fd);
      if (!res.ok) {
        setError(res.error ?? 'erro');
      } else {
        setStatus(newStatus);
        router.refresh();
      }
    });
  }

  function remove() {
    if (!window.confirm('Remover este inscrito?\n\nEsta ação é permanente e libera a vaga.')) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await deleteInscricaoAction(fd);
      if (!res.ok) {
        setError(res.error ?? 'erro');
      } else {
        router.refresh();
      }
    });
  }

  if (editing) {
    return (
      <div className="inline-flex flex-col gap-1 items-end">
        <select
          value={status}
          disabled={pending}
          onChange={(e) => updateStatus(e.target.value)}
          className="text-xs border rounded px-1 py-0.5"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-gray-500 underline"
        >
          fechar
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1 items-end">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
        >
          Status
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
        >
          Remover
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}