// Form de confirmação para ações destrutivas (desativar curso, cancelar aula, remover inscrito).
// Recebe uma Server Action via prop e submete com confirmação Dark Violet.
//
// Migration note (PR-6): window.confirm → <ConfirmDialog>; erros inline → <Toast>.
'use client';
import { useRef, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  hiddenFields?: Record<string, string>;
  children?: ReactNode;
  className?: string;
  /** Mensagem exibida no toast de sucesso. Quando ausente, nenhum toast é disparado. */
  successMessage?: string;
};

export function ConfirmForm({
  action,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  hiddenFields = {},
  children,
  className = '',
  successMessage,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [askOpen, setAskOpen] = useState(false);
  const toast = useToast();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAskOpen(true);
  }

  function runConfirm() {
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      const res = await action(fd);
      setAskOpen(false);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
      } else if (successMessage) {
        toast.success(successMessage);
      }
    });
  }

  const colors =
    variant === 'danger'
      ? 'bg-danger text-white hover:opacity-90 active:opacity-80'
      : 'bg-success text-white hover:opacity-90 active:opacity-80';

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} className={className}>
        {Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {children}
        <button
          type="submit"
          disabled={pending}
          className={`text-xs px-3 py-1 rounded ${colors} disabled:opacity-50`}
        >
          {pending ? 'Aguarde…' : confirmText}
        </button>
        <span className="text-xs text-text-muted ml-2">{cancelText}</span>
      </form>

      <ConfirmDialog
        open={askOpen}
        variant={variant}
        title={confirmText}
        description={message}
        confirmLabel={confirmText}
        cancelLabel={cancelText}
        pending={pending}
        onConfirm={runConfirm}
        onCancel={() => setAskOpen(false)}
      />
    </>
  );
}