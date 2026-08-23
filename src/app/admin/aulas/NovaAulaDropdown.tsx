'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/components/ui/cn';

type CursoOption = {
  id: string;
  name: string;
};

/**
 * Dropdown "Adicionar aula" — usado no header da página `/admin/aulas`.
 *
 * Como a página lista aulas de TODOS os cursos, criar uma aula exige antes
 * escolher um curso (courseId é obrigatório). O dropdown lista os cursos
 * ativos; ao selecionar, redireciona pra `/admin/cursos/[id]/aulas/nova`
 * do curso escolhido, onde o `AulaForm` client-side cuida do submit.
 *
 * Visual: pílula accent (mesmo padrão do botão "+ Novo" do AdminTable),
 * com select nativo overlay transparente (UX consistente entre browsers).
 *
 * Empty state: se não há cursos ativos, mostra pill disabled com hint.
 */
export function NovaAulaDropdown({ cursos }: { cursos: CursoOption[] }) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const courseId = e.target.value;
    if (courseId) {
      router.push(`/admin/cursos/${courseId}/aulas/nova`);
    }
  }

  const basePillClasses = cn(
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-label font-medium',
    'bg-accent text-white hover:bg-accent-hover transition-colors duration-150',
    'focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-app-bg',
    'select-none whitespace-nowrap',
  );

  if (cursos.length === 0) {
    return (
      <span
        className={cn(
          basePillClasses,
          'opacity-50 cursor-not-allowed',
        )}
        title="Crie um curso antes de adicionar aulas."
        aria-disabled="true"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
        Adicionar aula
      </span>
    );
  }

  return (
    <label className={cn(basePillClasses, 'relative')}>
      <Plus className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
      Adicionar aula
      <select
        onChange={handleChange}
        defaultValue=""
        aria-label="Selecione um curso para criar uma nova aula"
        className={cn(
          // O select fica invisível por cima do label para preservar a
          // affordance de pílula accent + usar o dropdown nativo do browser.
          'absolute inset-0 opacity-0 cursor-pointer',
          // Reset padding/focus do native select para não interferir no label.
          'appearance-none bg-transparent border-none outline-none',
        )}
        style={{ position: 'absolute', inset: 0 }}
      >
        <option value="" disabled>
          Escolha o curso
        </option>
        {cursos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
