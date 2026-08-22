export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/db';
import { formatBRL } from '@/lib/helpers';

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
            <div className="text-xs text-gray-500">Duração: {s.durationMin} min · slug: <code>{s.slug}</code> · {s.active ? '✅ ativo' : '❌ inativo'}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
