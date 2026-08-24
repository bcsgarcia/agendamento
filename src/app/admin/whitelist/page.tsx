import Link from 'next/link';
import { ShieldCheck, AlertCircle, Phone, CalendarPlus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Pill } from '@/components/ui/Pill';

// Mapeia DDI do telefone → código ISO do país (BR, PT, US, etc.).
// Usado como badge neutro ao lado de cada número da whitelist.
// ORDEM IMPORTA: DDIs mais longos devem vir antes (ex: 351 antes de 3/3),
// porque startsWith para no primeiro match. Ajustado pra evitar falsos positivos.
const COUNTRY_BY_DDI: Array<{ ddi: string; code: string }> = [
  { ddi: '55', code: 'BR' },
  { ddi: '351', code: 'PT' },
  { ddi: '44', code: 'GB' },
  { ddi: '34', code: 'ES' },
  { ddi: '33', code: 'FR' },
  { ddi: '49', code: 'DE' },
  { ddi: '54', code: 'AR' },
  { ddi: '52', code: 'MX' },
  { ddi: '1', code: 'US' },
];

function countryCode(phone: string): string {
  for (const { ddi, code } of COUNTRY_BY_DDI) {
    if (phone.startsWith(ddi)) return code;
  }
  return '??';
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WhitelistPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const entries = await prisma.whitelist.findMany({ orderBy: { criadoEm: 'desc' } });

  const activeCount = entries.filter((e) => e.active).length;

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para dashboard
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 mt-2 mb-2 flex-wrap">
        <ShieldCheck className="w-6 h-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <h1 className="text-h1 text-text font-semibold">Whitelist</h1>
        <Pill variant="inactive">
          {activeCount} ativo{activeCount === 1 ? '' : 's'}
        </Pill>
      </div>
      <p className="text-body text-text-muted mb-6">
        Números autorizados a receber resposta do bot. Quando a flag{' '}
        <code className="font-mono text-caption text-accent bg-accent-bg/30 px-1.5 py-0.5 rounded-md">
          whitelist_enabled
        </code>{' '}
        está ativa, só estes números recebem resposta (outros são ignorados silenciosamente).
      </p>

      {searchParams.error === 'phone_required' && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2 p-3 bg-danger/10 border border-danger/30 rounded-[10px] text-body text-danger"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} aria-hidden="true" />
          <span>Telefone é obrigatório.</span>
        </div>
      )}

      {/* Form pra adicionar */}
      <form
        action="/api/admin/whitelist"
        method="post"
        className="mb-6 bg-card border border-border-subtle rounded-card p-5"
      >
        <input type="hidden" name="action" value="add" />
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-label font-medium text-text-muted mb-1">
              Nome (opcional)
            </label>
            <input
              type="text"
              name="name"
              placeholder="Ex: Bruno, Aline, Maria Silva"
              className="w-full px-3 py-2 bg-app-bg-alt border border-border-subtle rounded-[10px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors duration-150"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-label font-medium text-text-muted mb-1">
              Telefone (com DDI do país)
            </label>
            <input
              type="text"
              name="phone"
              placeholder="5511912345678"
              required
              minLength={10}
              maxLength={15}
              pattern="[0-9]+"
              className="w-full px-3 py-2 bg-app-bg-alt border border-border-subtle rounded-[10px] text-text placeholder:text-text-muted font-mono focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors duration-150"
            />
            <p className="text-caption text-text-muted mt-1">
              Apenas dígitos, com DDI. Exemplos:{' '}
              <span className="font-mono">5511912345678</span> (BR) ·{' '}
              <span className="font-mono">351912345678</span> (PT) ·{' '}
              <span className="font-mono">14155552671</span> (US)
            </p>
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-accent text-white rounded-[10px] text-label font-medium hover:bg-accent-hover transition-colors duration-150 whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <CalendarPlus className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
            Adicionar
          </button>
        </div>
      </form>

      {/* Lista de números */}
      <div className="bg-card border border-border-subtle rounded-card overflow-hidden shadow-card">
        {entries.length === 0 ? (
          <div className="px-5 py-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-card bg-card-elevated border border-border-subtle flex items-center justify-center mb-3">
              <Phone className="w-6 h-6 text-text-muted" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className="text-body text-text-muted">
              Nenhum número na whitelist. Adicione um acima.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 transition-colors duration-150 hover:bg-card-elevated"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <Pill variant="inactive">
                      <span className="font-mono font-semibold">{countryCode(entry.phone)}</span>
                    </Pill>
                    <code className="font-mono text-body text-text bg-app-bg-alt px-2 py-1 rounded-md border border-border-subtle break-all">
                      {entry.phone}
                    </code>
                    {entry.active ? (
                      <Pill variant="active">ATIVO</Pill>
                    ) : (
                      <Pill variant="inactive">desligado</Pill>
                    )}
                  </div>
                  {entry.name && (
                    <p className="text-body text-text mt-2">{entry.name}</p>
                  )}
                  {entry.notes && (
                    <p className="text-caption text-text-muted mt-1 break-words">
                      {entry.notes}
                    </p>
                  )}
                  <p className="text-caption text-text-muted mt-1">
                    Adicionado: {new Date(entry.criadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {/* Toggle ativo/inativo */}
                  <form action="/api/admin/whitelist" method="post">
                    <input type="hidden" name="action" value="toggle" />
                    <input type="hidden" name="id" value={entry.id} />
                    <button
                      type="submit"
                      className={
                        'px-3 py-1 text-caption font-medium rounded-[10px] border transition-colors duration-150 ' +
                        (entry.active
                          ? 'bg-card border-border-subtle text-text hover:bg-card-elevated'
                          : 'bg-accent-bg/30 border-accent/30 text-accent hover:bg-accent-bg/50')
                      }
                    >
                      {entry.active ? 'Desligar' : 'Ativar'}
                    </button>
                  </form>
                  {/* Deletar */}
                  <form action="/api/admin/whitelist" method="post">
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="phone" value={entry.phone} />
                    <button
                      type="submit"
                      className="px-3 py-1 text-caption font-medium rounded-[10px] border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 transition-colors duration-150"
                    >
                      Remover
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
