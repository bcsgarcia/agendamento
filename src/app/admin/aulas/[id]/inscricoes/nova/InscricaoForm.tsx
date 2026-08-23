'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInscricaoAction } from '@/lib/course-actions';
import { SubmitButton, CancelLink, FormError } from '@/components/AdminForm';

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
        <label className="block text-sm font-medium mb-1">Nome *</label>
        <input
          type="text"
          name="nomeInscrito"
          required
          maxLength={200}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telefone</label>
          <input
            type="text"
            name="telefone"
            maxLength={30}
            placeholder="+351 9XX XXX XXX"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Valor pago (R$)</label>
          <input
            type="text"
            name="valorPago"
            inputMode="decimal"
            placeholder="0,00"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data do sinal</label>
          <input
            type="date"
            name="dataSinal"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            name="sinalPago"
            id="sinalPago"
            checked={sinalPago}
            onChange={(e) => setSinalPago(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="sinalPago" className="text-sm">
            Sinal pago
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status do pagamento</label>
        <select
          name="statusPagamento"
          defaultValue={sinalPago ? 'sinal_pago' : 'pendente'}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="pendente">Pendente</option>
          <option value="sinal_pago">Sinal pago</option>
          <option value="quitado">Quitado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Ao mudar para "quitado", a data de pagamento final é preenchida automaticamente.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <SubmitButton label="Adicionar inscrito" pending={pending} />
        <CancelLink href={`/admin/aulas/${aulaId}`} />
      </div>
    </form>
  );
}