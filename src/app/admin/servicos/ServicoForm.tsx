'use client';

// Form de Serviço reutilizável (criar/editar). Mesma shape de UX do CursoForm:
// tokens Dark Violet, SubmitButton/CancelLink/FormError compartilhados,
// preço em euros no input → cents na action via parseFloat + Math.round.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createServiceAction,
  updateServiceAction,
} from '@/lib/servico-actions';
import {
  SubmitButton,
  CancelLink,
  FormError,
  inputClass,
  labelClass,
  hintClass,
} from '@/components/AdminForm';

export type ServicoFormValues = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
}

type Props = {
  initial?: Partial<ServicoFormValues>;
  mode: 'create' | 'edit';
  /** Path com {id} como placeholder — será substituído pelo id retornado da action. */
  redirectPath: string;
};

export function ServicoForm({ initial, mode, redirectPath }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res =
        mode === 'create'
          ? await createServiceAction(formData)
          : await updateServiceAction(formData);
      if (!res.ok) {
        setError(res.error ?? 'erro desconhecido');
        return;
      }
      const id = res.id ?? initial?.id;
      if (id) router.push(redirectPath.replace('{id}', id));
    });
  }

  const priceInitial =
    initial?.priceCents != null
      ? (initial.priceCents / 100).toFixed(2).replace('.', ',')
      : '';
  const cancelHref =
    mode === 'edit' && initial?.id ? `/admin/servicos/${initial.id}` : '/admin/servicos';

  return (
    <form action={onSubmit} className="space-y-4 max-w-2xl">
      <FormError message={error} />
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id ?? ''} />}

      <div>
        <label className={labelClass}>Nome *</label>
        <input
          type="text"
          name="name"
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Slug *</label>
        <input
          type="text"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          pattern="[a-z0-9-]+"
          className={`${inputClass} font-mono`}
        />
        <p className={hintClass}>
          Apenas letras minúsculas, números e hífen. Auto-gerado do nome — edite se quiser.
        </p>
      </div>

      <div>
        <label className={labelClass}>Descrição *</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={initial?.description ?? ''}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Duração (min)</label>
          <input
            type="number"
            name="duration"
            min="1"
            required
            defaultValue={initial?.durationMin ?? ''}
            placeholder="60"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Preço (€)</label>
          <input
            type="text"
            name="price"
            inputMode="decimal"
            required
            defaultValue={priceInitial}
            placeholder="0,00"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          name="active"
          id="active"
          defaultChecked={initial?.active ?? true}
          className="rounded border-border-subtle bg-card text-accent focus:ring-2 focus:ring-accent/30"
        />
        <label htmlFor="active" className="text-body text-text">
          Serviço ativo (visível para clientes)
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border-subtle">
        <SubmitButton
          label={mode === 'create' ? 'Criar serviço' : 'Salvar alterações'}
          pending={pending}
        />
        <CancelLink href={cancelHref} />
      </div>
    </form>
  );
}
