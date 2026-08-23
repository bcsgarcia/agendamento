'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelAulaAction } from '@/lib/course-actions';

export function CancelAulaButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!window.confirm('Cancelar esta aula?\n\nInscritos existentes serão preservados (audit), mas a aula não aceitará novas inscrições.')) {
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await cancelAulaAction(fd);
      if (!res.ok) {
        window.alert(`Erro: ${res.error ?? 'desconhecido'}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? '…' : 'Cancelar'}
    </button>
  );
}