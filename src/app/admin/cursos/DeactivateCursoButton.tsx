'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deactivateCursoAction } from '@/lib/course-actions';

export function DeactivateCursoButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!window.confirm(`Desativar o curso "${name}"?\n\nEle deixará de aparecer na vitrine pública, mas as aulas e inscritos serão preservados.`)) {
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = await deactivateCursoAction(fd);
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
      {pending ? '…' : 'Desativar'}
    </button>
  );
}