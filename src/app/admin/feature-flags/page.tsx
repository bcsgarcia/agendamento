export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/db';

export default async function FeatureFlagsPage() {
  const flags = await prisma.featureFlag.findMany({ orderBy: { nome: 'asc' } });

  // Seeds: garante flags padrão
  const defaults = [
    { nome: 'whitelist_enabled', descricao: 'Filtro de números autorizados (ignora silenciosamente quem não tá na whitelist)' },
    { nome: 'ai_ativa', descricao: 'Se falso, bot responde com mensagem padrão sem chamar LLM' },
    { nome: 'modo_debug', descricao: 'Logs verbosos no Fluxi (debug de mensagens)' },
    { nome: 'manutencao', descricao: 'Bot responde com "em manutenção" pra qualquer msg' }
  ];
  for (const d of defaults) {
    if (!flags.find(f => f.nome === d.nome)) {
      await prisma.featureFlag.create({
        data: { nome: d.nome, ativo: false, descricao: d.descricao }
      }).catch(() => {});
    }
  }
  const allFlags = await prisma.featureFlag.findMany({ orderBy: { nome: 'asc' } });

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <a href="/admin" className="text-sm text-blue-600">← Voltar</a>
      <h1 className="text-3xl font-bold mt-2 mb-2">Feature Flags</h1>
      <p className="text-gray-600 mb-6">Liga/desliga funcionalidades em tempo real (sem deploy). Mudanças têm efeito em ~5 segundos (cache).</p>

      <form action="/api/admin/feature-flags" method="post" className="space-y-3">
        <input type="hidden" name="_method" value="PUT" />

        <div className="bg-white border rounded-lg divide-y">
          {allFlags.map(f => (
            <div key={f.id} className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <code className="font-mono text-sm font-semibold bg-gray-100 px-2 py-1 rounded">{f.nome}</code>
                  {f.ativo ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">ATIVO</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">desligado</span>
                  )}
                </div>
                {f.descricao && <p className="text-sm text-gray-600 mt-1">{f.descricao}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Última atualização: {new Date(f.atualizadoEm).toLocaleString('pt-BR')}
                </p>
              </div>
              <ToggleSwitch nome={f.nome} ativo={f.ativo} />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Salvar alterações
          </button>
        </div>
      </form>
    </main>
  );
}

// Toggle visual (Client Component) — usa form POST pra simplicidade
function ToggleSwitch({ nome, ativo }: { nome: string; ativo: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name={`flag[${nome}]`} value={ativo ? '0' : '1'} />
      <button
        type="submit"
        name={`toggle_${nome}`}
        value={ativo ? 'off' : 'on'}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          ativo ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            ativo ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
