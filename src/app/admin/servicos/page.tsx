export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/db';
import { formatBRL } from '@/lib/helpers';
import { Pill } from '@/components/ui/Pill';
import { Check, X as XIcon } from 'lucide-react';

export default async function ServicosPage() {
  const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <a href="/admin" className="text-sm text-blue-600">← Voltar</a>
      <h1 className="text-3xl font-bold mt-2 mb-6">Catálogo de Serviços ({services.length})</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(s => (
          <div key={s.id} className="p-4 bg-white border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{s.name}</h3>
              <span className="text-sm font-mono text-gray-600">{formatBRL(s.priceCents)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{s.description}</p>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>Duração: {s.durationMin} min</span>
              <span aria-hidden="true">·</span>
              <span>slug: <code>{s.slug}</code></span>
              <Pill
                variant={s.active ? 'active' : 'inactive'}
                icon={s.active
                  ? <Check className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
                  : <XIcon className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />}
              >
                {s.active ? 'Ativo' : 'Inativo'}
              </Pill>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
