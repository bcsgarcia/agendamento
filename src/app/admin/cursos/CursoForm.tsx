'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCursoAction,
  updateCursoAction,
} from '@/lib/course-actions';
import { SubmitButton, CancelLink, FormError } from '@/components/AdminForm';

export type CursoFormValues = {
  id?: string;
  slug: string;
  name: string;
  modality: string;
  description: string;
  priceCents: number;
  cargaHorariaHoras: number | null;
  maxAlunos: number | null;
  formaPagamento: string | null;
  purchaseUrl: string;
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
  initial?: Partial<CursoFormValues>;
  mode: 'create' | 'edit';
  /** Path com {id} como placeholder — será substituído pelo id retornado da action. */
  redirectPath: string;
};

export function CursoForm({
  initial,
  mode,
  redirectPath,
}: Props) {
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
      const res = mode === 'create'
        ? await createCursoAction(formData)
        : await updateCursoAction(formData);
      if (!res.ok) {
        setError(res.error ?? 'erro desconhecido');
        return;
      }
      const id = res.id ?? initial?.id;
      if (id) router.push(redirectPath.replace('{id}', id));
    });
  }

  const priceInitial = initial?.priceCents != null ? (initial.priceCents / 100).toFixed(2).replace('.', ',') : '';
  const cancelHref = mode === 'edit' && initial?.id ? `/admin/cursos/${initial.id}` : '/admin/cursos';

  return (
    <form action={onSubmit} className="space-y-4 max-w-2xl">
      <FormError message={error} />
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id ?? ''} />}

      <div>
        <label className="block text-sm font-medium mb-1">Nome *</label>
        <input
          type="text"
          name="name"
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Slug *</label>
        <input
          type="text"
          name="slug"
          required
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
          pattern="[a-z0-9-]+"
          className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">Apenas letras minúsculas, números e hífen. Auto-gerado do nome — edite se quiser.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Modalidade</label>
        <select
          name="modality"
          defaultValue={initial?.modality ?? 'presencial'}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="presencial">Presencial</option>
          <option value="online">Online</option>
          <option value="hibrido">Híbrido</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrição *</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={initial?.description ?? ''}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Carga horária (h)</label>
          <input
            type="number"
            name="cargaHorariaHoras"
            min="1"
            defaultValue={initial?.cargaHorariaHoras ?? ''}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max alunos</label>
          <input
            type="number"
            name="maxAlunos"
            min="1"
            defaultValue={initial?.maxAlunos ?? ''}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Preço (R$)</label>
          <input
            type="text"
            name="price"
            inputMode="decimal"
            required
            defaultValue={priceInitial}
            placeholder="0,00"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Forma de pagamento</label>
        <textarea
          name="formaPagamento"
          rows={3}
          defaultValue={initial?.formaPagamento ?? ''}
          placeholder="Ex: Pix com 10% off à vista, ou 3x no cartão"
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Texto livre. Você pode colocar regras de parcelamento, descontos etc.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Link de pagamento (URL)</label>
        <input
          type="url"
          name="purchaseUrl"
          defaultValue={initial?.purchaseUrl ?? ''}
          placeholder="https://..."
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          id="active"
          defaultChecked={initial?.active ?? true}
          className="rounded"
        />
        <label htmlFor="active" className="text-sm">
          Curso ativo (visível na vitrine pública)
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <SubmitButton
          label={mode === 'create' ? 'Criar curso' : 'Salvar alterações'}
          pending={pending}
        />
        <CancelLink href={cancelHref} />
      </div>
    </form>
  );
}