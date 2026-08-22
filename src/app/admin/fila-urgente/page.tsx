export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/db';

export default async function UrgentesPage() {
  const urgent = await prisma.urgentQueue.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <a href="/admin" className="text-sm text-blue-600">← Voltar</a>
      <h1 className="text-3xl font-bold mt-2 mb-2">Fila de Urgências</h1>
      <p className="text-gray-600 mb-6">Casos que o bot empurrou pra você resolver</p>
      <div className="space-y-3">
        {urgent.map(u => (
          <div key={u.id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-1 bg-yellow-200 text-yellow-900 rounded text-xs font-medium uppercase">{u.reason}</span>
              <span className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{u.contextSnapshot}</pre>
          </div>
        ))}
        {urgent.length === 0 && <p className="text-gray-500">✨ Nenhuma urgência pendente.</p>}
      </div>
    </main>
  );
}
