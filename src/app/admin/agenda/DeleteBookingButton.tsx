'use client';
// Botão "Excluir" inline na linha da tabela de bookings.
// Confirmação via ConfirmDialog; usa server action deleteBookingAction.
// Após sucesso, chama router.refresh() pra revalidar a lista (sem redirect,
// porque o usuário pode estar vendo outros bookings).
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteBookingAction } from '@/lib/agenda-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function DeleteBookingButton({
  id,
  customerLabel,
}: {
  id: string;
  /** Nome/telefone do cliente — exibido na confirmação pra desambiguar. */
  customerLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [askOpen, setAskOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function runDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await deleteBookingAction(fd);
      setAskOpen(false);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
      } else {
        toast.success('Booking excluído.');
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
        aria-label={`Excluir booking de ${customerLabel}`}
        title="Excluir booking"
        className="text-caption font-medium px-2.5 py-1 border border-danger/40 bg-card text-danger rounded-[10px] hover:bg-danger/10 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-3.5 h-3.5 inline" strokeWidth={2} aria-hidden="true" />
      </button>

      <ConfirmDialog
        open={askOpen}
        variant="danger"
        title={`Excluir o booking de ${customerLabel}?`}
        description="Esta ação é permanente e não pode ser desfeita. O histórico do cliente é preservado."
        confirmLabel="Excluir booking"
        cancelLabel="Voltar"
        pending={pending}
        onConfirm={runDelete}
        onCancel={() => setAskOpen(false)}
      />
    </>
  );
}
