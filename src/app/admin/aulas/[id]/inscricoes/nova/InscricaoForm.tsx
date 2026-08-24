'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInscricaoAction } from '@/lib/course-actions';
import {
  SubmitButton,
  CancelLink,
  FormError,
  inputClass,
  labelClass,
  hintClass,
} from '@/components/AdminForm';

type Props = {
  aulaId: string;
  /** Path com {id} como placeholder — em create inscricao, sempre volta pra aula. */
  redirectPath: string;
};

export function InscricaoForm({
  aulaId,
  redirectPath,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sinalPago, setSinalPago] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createInscricaoAction(formData);
      if (!res.ok) {
        setError(res.error ?? 'erro desconhecido');
        return;
      }
      // Volta pra aula — id conhecido
      router.push(redirectPath.replace('{id}', aulaId));
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <FormError message={error} />
      <input type="hidden" name="aulaId" value={aulaId} />

      <div>
        <label className={labelClass}>Nome *</label>
        <input
          type="text"
          name="nomeInscrito"
          required
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            name="email"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Telefone</label>
          <input
            type="text"
            name="telefone"
            maxLength={30}
            placeholder="+351 9XX XXX XXX"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className={labelClass}>Valor pago (€)</label>
          <input
            type="text"
            name="valorPago"
            inputMode="decimal"
            placeholder="0,00"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Data do sinal</label>
          <input
            type="date"
            name="dataSinal"
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            name="sinalPago"
            id="sinalPago"
            checked={sinalPago}
            onChange={(e) => setSinalPago(e.target.checked)}
            className="rounded border-border-subtle bg-card text-accent focus:ring-2 focus:ring-accent/30"
          />
          <label htmlFor="sinalPago" className="text-body text-text">
            Sinal pago
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>Status do pagamento</label>
        <select
          name="statusPagamento"
          defaultValue={sinalPago ? 'sinal_pago' : 'pendente'}
          className={inputClass}
        >
          <option value="pendente">Pendente</option>
          <option value="sinal_pago">Sinal pago</option>
          <option value="quitado">Quitado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <p className={hintClass}>
          Ao mudar para "quitado", a data de pagamento final é preenchida automaticamente.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-border-subtle">
        <SubmitButton label="Adicionar inscrito" pending={pending} />
        <CancelLink href={`/admin/aulas/${aulaId}`} />
      </div>
    </form>
  );
}
