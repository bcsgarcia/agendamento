'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelAulaAction } from '@/lib/course-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function CancelAulaButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [askOpen, setAskOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function runCancel() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await cancelAulaAction(fd);
      setAskOpen(false);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
      } else {
        toast.success('Aula cancelada.');
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAskOpen(true)}
        disabled={pending}
        className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? '…' : 'Cancelar'}
      </button>

      <ConfirmDialog
        open={askOpen}
        variant="danger"
        title="Cancelar esta aula?"
        description={
          <>
            Inscritos existentes serão preservados (audit), mas a aula não
            aceitará novas inscrições.
          </>
        }
        confirmLabel="Cancelar aula"
        cancelLabel="Voltar"
        pending={pending}
        onConfirm={runCancel}
        onCancel={() => setAskOpen(false)}
      />
    </>
  );
}