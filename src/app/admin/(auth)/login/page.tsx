import Link from 'next/link';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-sm p-8">
        <Link href="/admin/login" className="block text-center mb-6">
          <span className="text-3xl">🏥</span>
          <h1 className="text-2xl font-bold mt-2">Agendamento Admin</h1>
        </Link>

        {searchParams.error === 'invalid' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
            Email ou senha incorretos.
          </div>
        )}
        {searchParams.error === 'missing' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
            Preencha email e senha.
          </div>
        )}

        <form action="/api/auth/login" method="post" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              autoComplete="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Entrar
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Acesso restrito. Cada toggle / edição fica registrado no banco.
        </p>
      </div>
    </main>
  );
}
