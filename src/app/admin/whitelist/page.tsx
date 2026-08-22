export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/lib/db';

export default async function WhitelistPage({ searchParams }: { searchParams: { error?: string } }) {
  const entries = await prisma.whitelist.findMany({ orderBy: { criadoEm: 'desc' } });

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <a href="/admin" className="text-sm text-blue-600">← Voltar</a>
      <h1 className="text-3xl font-bold mt-2 mb-2">Whitelist</h1>
      <p className="text-gray-600 mb-6">
        Números autorizados a receber resposta do bot. Quando a flag{' '}
        <code className="font-mono bg-gray-100 px-1 rounded">whitelist_enabled</code>{' '}
        está ativa, só estes números recebem resposta (outros são ignorados silenciosamente).
      </p>

      {searchParams.error === 'phone_required' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
          Telefone é obrigatório.
        </div>
      )}

      {/* Form pra adicionar */}
      <form action="/api/admin/whitelist" method="post" className="mb-6 p-4 bg-white border rounded-lg">
        <input type="hidden" name="action" value="add" />
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome (opcional)</label>
            <input
              type="text"
              name="name"
              placeholder="Ex: Bruno, Aline, Maria Silva"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (com DDI)</label>
            <input
              type="text"
              name="phone"
              placeholder="5511912345678"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Formato: 55 + DDD + número (ex: 5511912345678)</p>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            Adicionar
          </button>
        </div>
      </form>

      {/* Lista de números */}
      <div className="bg-white border rounded-lg divide-y">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum número na whitelist. Adicione um acima.
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <code className="font-mono text-sm font-semibold bg-gray-100 px-2 py-1 rounded">
                    {entry.phone}
                  </code>
                  {entry.active ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">ATIVO</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">desligado</span>
                  )}
                </div>
                {entry.name && <p className="text-sm text-gray-700 mt-1">{entry.name}</p>}
                {entry.notes && <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Adicionado: {new Date(entry.criadoEm).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Toggle ativo/inativo */}
                <form action="/api/admin/whitelist" method="post" className="inline">
                  <input type="hidden" name="action" value="toggle" />
                  <input type="hidden" name="id" value={entry.id} />
                  <button
                    type="submit"
                    className={`px-3 py-1 text-xs rounded-lg border ${
                      entry.active
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                    }`}
                  >
                    {entry.active ? 'Desligar' : 'Ativar'}
                  </button>
                </form>
                {/* Deletar */}
                <form action="/api/admin/whitelist" method="post" className="inline">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="id" value={entry.id} />
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                    onClick={(e) => {
                      if (!confirm(`Remover ${entry.phone}?`)) e.preventDefault();
                    }}
                  >
                    Remover
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
