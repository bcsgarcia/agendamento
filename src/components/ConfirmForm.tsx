// Form de confirmação para ações destrutivas (desativar curso, cancelar aula, remover inscrito).
// Recebe uma Server Action via prop e submete com confirmação JS no client.
'use client';
import { useRef, useState, useTransition } from 'react';
import type { ReactNode } from 'react';

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  hiddenFields?: Record<string, string>;
  children?: ReactNode;
  className?: string;
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
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!window.confirm(message)) return;
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) setError(res.error ?? 'erro desconhecido');
    });
  }

  const colors =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-yellow-500 text-white hover:bg-yellow-600';

  return (
    <form ref={formRef} onSubmit={onSubmit} className={className}>
      {Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children}
      {error && (
        <div className="mt-2 text-xs text-red-600">{error}</div>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`text-xs px-3 py-1 rounded ${colors} disabled:opacity-50`}
      >
        {pending ? 'Aguarde…' : confirmText}
      </button>
      <span className="text-xs text-gray-500 ml-2">{cancelText}</span>
    </form>
  );
}