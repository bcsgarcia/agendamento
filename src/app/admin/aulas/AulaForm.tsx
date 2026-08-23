'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAulaAction, updateAulaAction } from '@/lib/course-actions';
import {
  SubmitButton,
  CancelLink,
  FormError,
  inputClass,
  labelClass,
  hintClass,
} from '@/components/AdminForm';

export type AulaFormValues = {
  dataInicio: string;
  dataFim: string;
  local: string;
  maxAlunos: number | null;
  /** Limite herdado do Course. Usado como placeholder/hint quando Aula.maxAlunos é null. */
  maxAlunosDefault: number | null;
  status: string;
};

type Props = {
  mode: 'create' | 'edit';
  courseId?: string;
  aulaId?: string;
  defaultValues: AulaFormValues;
  /** Path com {id} como placeholder — será substituído pelo id retornado da action. */
  redirectPath: string;
  cancelHref?: string;
};

export function AulaForm({
  mode,
  courseId,
  aulaId,
  defaultValues,
  redirectPath,
  cancelHref,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = mode === 'create'
        ? await createAulaAction(formData)
        : await updateAulaAction(formData);
      if (!res.ok) {
        setError(res.error ?? 'erro desconhecido');
        return;
      }
      const id = res.id ?? (mode === 'create' ? undefined : aulaId);
      if (id) router.push(redirectPath.replace('{id}', id));
    });
  }

  const defaultCancelHref = mode === 'create' && courseId
    ? `/admin/cursos/${courseId}`
    : aulaId
    ? `/admin/aulas/${aulaId}`
    : '/admin/cursos';

  return (
    <form action={onSubmit} className="space-y-4">
      <FormError message={error} />
      {mode === 'create' && courseId && (
        <input type="hidden" name="courseId" value={courseId} />
      )}
      {mode === 'edit' && <input type="hidden" name="id" value={aulaId ?? ''} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Data/hora início *</label>
          <input
            type="datetime-local"
            name="dataInicio"
            required
            defaultValue={defaultValues.dataInicio}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Data/hora fim *</label>
          <input
            type="datetime-local"
            name="dataFim"
            required
            defaultValue={defaultValues.dataFim}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Local</label>
        <input
          type="text"
          name="local"
          maxLength={200}
          defaultValue={defaultValues.local}
          placeholder="Ex: Clínica — sala 2, ou Online via Zoom"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Max alunos</label>
          <input
            type="number"
            name="maxAlunos"
            min="1"
            defaultValue={defaultValues.maxAlunos ?? ''}
            placeholder={
              defaultValues.maxAlunosDefault != null
                ? `Padrão do curso: ${defaultValues.maxAlunosDefault}`
                : 'Sem limite definido'
            }
            className={inputClass}
          />
          <p className={hintClass}>
            Vazio = segue o padrão do curso. Preencha pra aumentar vagas nesta aula específica.
          </p>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={defaultValues.status} className={inputClass}>
            <option value="aberta">Aberta</option>
            <option value="lotada">Lotada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <p className={hintClass}>Muda p/ "lotada" automaticamente ao lotar.</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border-subtle">
        <SubmitButton
          label={mode === 'create' ? 'Criar aula' : 'Salvar alterações'}
          pending={pending}
        />
        <CancelLink href={cancelHref ?? defaultCancelHref} />
      </div>
    </form>
  );
}
