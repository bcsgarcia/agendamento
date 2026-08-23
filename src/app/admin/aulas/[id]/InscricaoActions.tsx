'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateInscricaoAction, deleteInscricaoAction } from '@/lib/course-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const STATUSES = ['pendente', 'sinal_pago', 'quitado', 'cancelado'] as const;

export function InscricaoActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [askRemoveOpen, setAskRemoveOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function updateStatus(newStatus: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      fd.append('statusPagamento', newStatus);
      const res = await updateInscricaoAction(fd);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
      } else {
        setStatus(newStatus);
        toast.success('Status atualizado.');
        router.refresh();
      }
    });
  }

  function runRemove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await deleteInscricaoAction(fd);
      setAskRemoveOpen(false);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
      } else {
        toast.success('Inscrito removido.');
        router.refresh();
      }
    });
  }

  if (editing) {
    return (
      <>
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
        </div>

        <ConfirmDialog
          open={askRemoveOpen}
          variant="danger"
          title="Remover este inscrito?"
          description="Esta ação é permanente e libera a vaga."
          confirmLabel="Remover"
          cancelLabel="Voltar"
          pending={pending}
          onConfirm={runRemove}
          onCancel={() => setAskRemoveOpen(false)}
        />
      </>
    );
  }

  return (
    <>
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
            onClick={() => setAskRemoveOpen(true)}
            disabled={pending}
            className="text-label px-2 py-1 border border-danger/40 text-danger rounded-card hover:bg-danger/10 disabled:opacity-50 transition-colors duration-150"
          >
            Remover
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={askRemoveOpen}
        variant="danger"
        title="Remover este inscrito?"
        description="Esta ação é permanente e libera a vaga."
        confirmLabel="Remover"
        cancelLabel="Voltar"
        pending={pending}
        onConfirm={runRemove}
        onCancel={() => setAskRemoveOpen(false)}
      />
    </>
  );
}