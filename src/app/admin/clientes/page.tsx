export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/db';
import { AlertTriangle } from 'lucide-react';

export default async function ClientesPage() {
  const customers = await prisma.customer.findMany({
    include: { bookings: { include: { service: true }, orderBy: { startsAt: 'desc' }, take: 3 } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <a href="/admin" className="text-sm text-blue-600">← Voltar</a>
      <h1 className="text-3xl font-bold mt-2 mb-6">Clientes ({customers.length})</h1>
      <div className="space-y-3">
        {customers.map(c => (
          <div key={c.id} className="p-4 bg-white border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{c.name || 'Sem nome'}</div>
                <div className="text-sm text-gray-500 font-mono">{c.phone}</div>
                {c.allergies && (
                  <div className="text-xs text-red-600 mt-1 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                    {c.allergies}
                  </div>
                )}
                {c.tags.length > 0 && <div className="text-xs text-blue-600 mt-1">{c.tags.join(', ')}</div>}
              </div>
              <div className="text-xs text-gray-500">{c.bookings.length} booking(s)</div>
            </div>
          </div>
        ))}
        {customers.length === 0 && <p className="text-gray-500">Nenhum cliente cadastrado.</p>}
      </div>
    </main>
  );
}
