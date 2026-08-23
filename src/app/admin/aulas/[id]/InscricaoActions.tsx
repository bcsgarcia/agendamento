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
          className="text-caption border border-border-subtle bg-card text-text rounded px-1.5 py-0.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
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
          className="text-caption text-text-muted hover:text-accent underline transition-colors duration-150"
        >
          fechar
        </button>
        {error && <span className="text-caption text-danger">{error}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1 items-end">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-label px-2 py-1 border border-border-subtle bg-card text-text rounded-card hover:bg-card-elevated transition-colors duration-150"
        >
          Status
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-label px-2 py-1 border border-danger/40 text-danger rounded-card hover:bg-danger/10 disabled:opacity-50 transition-colors duration-150"
        >
          Remover
        </button>
      </div>
      {error && <span className="text-caption text-danger">{error}</span>}
    </div>
  );
}
