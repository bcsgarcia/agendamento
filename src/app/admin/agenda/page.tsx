export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/db';

export default async function AgendaPage() {
  const bookings = await prisma.booking.findMany({
    include: { customer: true, service: true },
    orderBy: { startsAt: 'asc' },
    take: 50
  });

  const byDay = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = b.startsAt.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(b);
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <a href="/admin" className="text-sm text-blue-600">← Voltar</a>
      <h1 className="text-3xl font-bold mt-2 mb-6">Agenda</h1>
      {[...byDay.entries()].length === 0 && <p className="text-gray-500">Nenhum booking cadastrado ainda.</p>}
      {[...byDay.entries()].map(([day, dayBookings]) => (
        <div key={day} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            {new Date(day).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h2>
          <div className="space-y-2">
            {dayBookings.map(b => (
              <div key={b.id} className="p-4 bg-white border rounded-lg flex justify-between">
                <div>
                  <div className="font-mono text-sm text-gray-500">
                    {b.startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {b.endsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="font-medium">{b.customer.name || b.customer.phone}</div>
                  <div className="text-sm text-gray-600">{b.service.name}</div>
                </div>
                <span className={'px-3 py-1 rounded text-sm ' + (
                  b.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                )}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
