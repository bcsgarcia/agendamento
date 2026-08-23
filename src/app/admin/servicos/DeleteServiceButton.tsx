'use client';

// Botão de excluir serviço com confirmação inline (ConfirmDialog).
// Server Action: deleteServiceAction — bloqueia exclusão se houver bookings
// associados (mensagem orienta Bruno a inativar em vez de excluir).
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteServiceAction } from '@/lib/servico-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function DeleteServiceButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [askOpen, setAskOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function runDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await deleteServiceAction(fd);
      setAskOpen(false);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
      } else {
        toast.success('Serviço excluído.');
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
        className="text-caption font-medium px-2.5 py-1 border border-red-300 text-red-700 rounded-[10px] hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? '…' : 'Excluir'}
      </button>

      <ConfirmDialog
        open={askOpen}
        variant="danger"
        title={`Excluir o serviço "${name}"?`}
        description={
          <>
            Esta ação é permanente. Se houver agendamentos usando este serviço,
            a exclusão será bloqueada — nesse caso, inative-o em vez de excluir.
          </>
        }
        confirmLabel="Excluir serviço"
        cancelLabel="Voltar"
        pending={pending}
        onConfirm={runDelete}
        onCancel={() => setAskOpen(false)}
      />
    </>
  );
}
