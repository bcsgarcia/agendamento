'use client';
// Form cliente reutilizável (criar + editar). Dark Violet tokens via AdminForm.
// Server Action: createCustomerAction / updateCustomerAction.
//
// Comportamento de tags: input livre → split por vírgula no submit (server side).
// BirthDate vazio → null explícito (limpa no DB).

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCustomerAction,
  updateCustomerAction,
} from '@/lib/cliente-actions';
import {
  SubmitButton,
  CancelLink,
  FormError,
  inputClass,
  labelClass,
  hintClass,
} from '@/components/AdminForm';

export type ClienteFormValues = {
  id?: string;
  phone: string;
  name: string | null;
  /** Aceita Date (Prisma) ou string ISO (data de <input type="date">) ou null. */
  birthDate: Date | string | null | undefined;
  allergies: string | null;
  notes: string | null;
  preferredTime: string | null;
  tags: string[];
};

const PREFERRED_TIME_OPTIONS = [
  { value: '', label: 'Sem preferência' },
  { value: 'Manhã', label: 'Manhã' },
  { value: 'Tarde', label: 'Tarde' },
  { value: 'Noite', label: 'Noite' },
  { value: 'Sábado', label: 'Sábado' },
  { value: 'Domingo', label: 'Domingo' },
  { value: 'Flexível', label: 'Flexível' },
];

type Props = {
  initial?: Partial<ClienteFormValues>;
  mode: 'create' | 'edit';
  /** Path com {id} como placeholder — substituído pelo id retornado da action. */
  redirectPath: string;
};

function dateInputValue(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  // yyyy-mm-dd (formato aceito por <input type="date">)
  return date.toISOString().slice(0, 10);
}

export function ClienteForm({ initial, mode, redirectPath }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Tags como texto (vírgula-separado) — UX simples, server faz parse.
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '));

  function onSubmit(formData: FormData) {
    setError(null);
    // Substitui tags do form (texto livre) pelo estado local,
    // garantindo que pegamos exatamente o que o usuário vê.
    formData.set('tags', tagsText);
    startTransition(async () => {
      const res =
        mode === 'create'
          ? await createCustomerAction(formData)
          : await updateCustomerAction(formData);
      if (!res.ok) {
        setError(res.error ?? 'erro desconhecido');
        return;
      }
      const id = res.id ?? initial?.id;
      if (id) router.push(redirectPath.replace('{id}', id));
    });
  }

  const cancelHref =
    mode === 'edit' && initial?.id ? `/admin/clientes/${initial.id}` : '/admin/clientes';

  return (
    <form action={onSubmit} className="space-y-4 max-w-2xl">
      <FormError message={error} />
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id ?? ''} />}

      <div>
        <label className={labelClass}>Telefone *</label>
        <input
          type="tel"
          name="phone"
          required
          defaultValue={initial?.phone ?? ''}
          placeholder="Ex: 5511999999999"
          className={`${inputClass} font-mono`}
        />
        <p className={hintClass}>Identificador único do cliente (WhatsApp).</p>
      </div>

      <div>
        <label className={labelClass}>Nome</label>
        <input
          type="text"
          name="name"
          defaultValue={initial?.name ?? ''}
          placeholder="Nome do cliente"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Data de nascimento</label>
          <input
            type="date"
            name="birthDate"
            defaultValue={dateInputValue(initial?.birthDate)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Horário preferido</label>
          <select
            name="preferredTime"
            defaultValue={initial?.preferredTime ?? ''}
            className={inputClass}
          >
            {PREFERRED_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Alergias</label>
        <textarea
          name="allergies"
          rows={2}
          defaultValue={initial?.allergies ?? ''}
          placeholder="Ex: alergia a lidocaína, frutos do mar…"
          className={inputClass}
        />
        <p className={hintClass}>Visível no detalhe do cliente. Sinalizado com ícone.</p>
      </div>

      <div>
        <label className={labelClass}>Observações</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ''}
          placeholder="Notas internas (preferências, restrições, histórico relevante)…"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Tags</label>
        <input
          type="text"
          name="tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="Ex: VIP, mensalista, sensível a perfume"
          className={inputClass}
        />
        <p className={hintClass}>Separar tags por vírgula. Vão aparecer como pílulas no perfil.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-border-subtle">
        <SubmitButton
          label={mode === 'create' ? 'Criar cliente' : 'Salvar alterações'}
          pending={pending}
        />
        <CancelLink href={cancelHref} />
      </div>
    </form>
  );
}