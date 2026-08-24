'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deactivateCursoAction } from '@/lib/course-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function DeactivateCursoButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [askOpen, setAskOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function runDeactivate() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await deactivateCursoAction(fd);
      setAskOpen(false);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
      } else {
        toast.success('Curso desativado.');
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
        className="text-xs px-2 py-1 border border-danger/40 text-danger rounded hover:bg-danger/10 disabled:opacity-50"
      >
        {pending ? '…' : 'Desativar'}
      </button>

      <ConfirmDialog
        open={askOpen}
        variant="danger"
        title={`Desativar o curso "${name}"?`}
        description={
          <>
            Ele deixará de aparecer na vitrine pública, mas as aulas e
            inscritos serão preservados.
          </>
        }
        confirmLabel="Desativar curso"
        cancelLabel="Voltar"
        pending={pending}
        onConfirm={runDeactivate}
        onCancel={() => setAskOpen(false)}
      />
    </>
  );
}