'use client';
// Formulário reutilizável para criar/editar Booking (agenda).
// Server Action chamada via useTransition; em sucesso, router.push pro detalhe.
// Ao selecionar service, auto-calcula endsAt = startsAt + durationMin.
// Edits de customer/service recarregam o form pra preservar consistência.
// (Bruno pediu em 2026-08-23: "datapickers", selects de customer/service.)
import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBookingAction, updateBookingAction } from '@/lib/agenda-actions';
import {
  SubmitButton,
  CancelLink,
  FormError,
  inputClass,
  labelClass,
  hintClass,
} from '@/components/AdminForm';

export type CustomerOption = { id: string; label: string };
export type ServiceOption = {
  id: string;
  name: string;
  priceCents: number;
  durationMin: number;
};

export type BookingFormValues = {
  customerId: string;
  serviceId: string;
  /** Format expected by <input type="datetime-local">: YYYY-MM-DDTHH:MM (LOCAL). */
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string;
};

type Props = {
  mode: 'create' | 'edit';
  bookingId?: string;
  defaultValues: BookingFormValues;
  /** Path com {id} como placeholder — será substituído pelo id retornado da action. */
  redirectPath: string;
  cancelHref: string;
  customers: CustomerOption[];
  services: ServiceOption[];
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no_show', label: 'Não compareceu' },
] as const;

export function BookingForm({
  mode,
  bookingId,
  defaultValues,
  redirectPath,
  cancelHref,
  customers,
  services,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estado controlado pra calcular endsAt automaticamente quando o user
  // troca o service (auto-fill = startsAt + durationMin do service escolhido).
  const [startsAt, setStartsAt] = useState(defaultValues.startsAt);
  const [serviceId, setServiceId] = useState(defaultValues.serviceId);
  const [endsAt, setEndsAt] = useState(defaultValues.endsAt);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  function onServiceChange(newServiceId: string) {
    setServiceId(newServiceId);
    // Se ainda não tem endsAt explícito (modo create, ou campo vazio em edit),
    // auto-fills endsAt = startsAt + durationMin do novo service.
    const svc = services.find((s) => s.id === newServiceId);
    if (svc && startsAt && !endsAt) {
      const start = new Date(startsAt);
      const end = new Date(start.getTime() + svc.durationMin * 60_000);
      setEndsAt(toLocalInput(end));
    }
  }

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = mode === 'create'
        ? await createBookingAction(formData)
        : await updateBookingAction(formData);
      if (!res.ok) {
        setError(res.error ?? 'erro desconhecido');
        return;
      }
      const id = res.id ?? bookingId;
      if (id) router.push(redirectPath.replace('{id}', id));
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-2xl">
      <FormError message={error} />
      {mode === 'edit' && <input type="hidden" name="id" value={bookingId ?? ''} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Cliente *</label>
          <select
            name="customerId"
            required
            defaultValue={defaultValues.customerId}
            className={inputClass}
          >
            <option value="" disabled>Selecione um cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          {customers.length === 0 && (
            <p className={hintClass}>
              Nenhum cliente cadastrado. Crie um cliente antes de adicionar booking.
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Serviço *</label>
          <select
            name="serviceId"
            required
            value={serviceId}
            onChange={(e) => onServiceChange(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>Selecione um serviço</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.durationMin}min
              </option>
            ))}
          </select>
          {services.length === 0 && (
            <p className={hintClass}>
              Nenhum serviço ativo. Crie um serviço antes de adicionar booking.
            </p>
          )}
          {selectedService && (
            <p className={hintClass}>
              Duração: {selectedService.durationMin} min. Trocar o serviço
              recalcula automaticamente o horário de fim se ele estiver vazio.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Data/hora início *</label>
          <input
            type="datetime-local"
            name="startsAt"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Data/hora fim *</label>
          <input
            type="datetime-local"
            name="endsAt"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={inputClass}
          />
          <p className={hintClass}>
            Pré-preenchido com startsAt + duração do serviço. Edite se necessário.
          </p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <select
          name="status"
          defaultValue={defaultValues.status}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Observações</label>
        <textarea
          name="notes"
          rows={4}
          maxLength={2000}
          defaultValue={defaultValues.notes}
          placeholder="Anotações internas (não aparece pro cliente)"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-border-subtle">
        <SubmitButton
          label={mode === 'create' ? 'Criar booking' : 'Salvar alterações'}
          pending={pending}
        />
        <CancelLink href={cancelHref} />
      </div>
    </form>
  );
}

// Helpers locais — mantém o form standalone (não depende de src/lib/helpers).
// Formato esperado pelo <input type="datetime-local">: YYYY-MM-DDTHH:MM (LOCAL).
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
