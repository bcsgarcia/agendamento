'use client';
// Botão "Excluir" cliente — abre ConfirmDialog, chama deleteCustomerAction,
// exibe toast de sucesso/erro. Após sucesso, redireciona pra lista.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCustomerAction } from '@/lib/cliente-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function ExcluirClienteButton({
  id,
  name,
  variant = 'inline',
}: {
  id: string;
  name: string;
  /** 'inline' = botão compacto pra lista; 'detail' = botão destaque na página detalhe. */
  variant?: 'inline' | 'detail';
}) {
  const [pending, startTransition] = useTransition();
  const [askOpen, setAskOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function runDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await deleteCustomerAction(fd);
      setAskOpen(false);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
        return;
      }
      toast.success('Cliente excluído.');
      // Inline (lista) — só refresh; detail — volta pra lista.
      if (variant === 'detail') {
        router.push('/admin/clientes');
      } else {
        router.refresh();
      }
    });
  }

  const triggerClass =
    variant === 'detail'
      ? 'px-4 py-2 rounded-card text-label font-medium border border-danger/40 bg-card text-danger hover:bg-danger/15 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-danger/40'
      : 'text-label px-2.5 py-1 border border-danger/40 bg-card text-danger rounded-card hover:bg-danger/15 transition-colors duration-150';

  return (
    <>
      <button
        type="button"
        onClick={() => setAskOpen(true)}
        disabled={pending}
        className={triggerClass}
      >
        {pending ? 'Excluindo…' : 'Excluir'}
      </button>

      <ConfirmDialog
        open={askOpen}
        variant="danger"
        title={`Excluir o cliente "${name || 'sem nome'}"?`}
        description={
          <>
            Esta ação não pode ser desfeita. Clientes com agendamentos serão
            <span className="text-danger font-medium"> bloqueados </span>
            — exclua os agendamentos antes.
          </>
        }
        confirmLabel="Excluir cliente"
        cancelLabel="Voltar"
        pending={pending}
        onConfirm={runDelete}
        onCancel={() => setAskOpen(false)}
      />
    </>
  );
}