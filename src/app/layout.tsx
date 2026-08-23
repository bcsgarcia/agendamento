import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = { title: 'Agendamento — Clínica' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={inter.className}>
        {user && (
          <nav className="bg-white border-b px-8 py-3 flex gap-6 text-sm items-center">
            <Link href="/admin" className="font-semibold">🏥 Clínica</Link>
            <Link href="/admin/agenda" className="text-gray-600 hover:text-gray-900">Agenda</Link>
            <Link href="/admin/clientes" className="text-gray-600 hover:text-gray-900">Clientes</Link>
            <Link href="/admin/servicos" className="text-gray-600 hover:text-gray-900">Serviços</Link>
            <Link href="/admin/fila-urgente" className="text-gray-600 hover:text-gray-900">Urgências</Link>
            <Link href="/admin/whitelist" className="text-gray-600 hover:text-gray-900">Whitelist</Link>
            <Link href="/admin/feature-flags" className="text-gray-600 hover:text-gray-900">Feature Flags</Link>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-gray-500">{user.email}</span>
              <form action="/api/auth/logout" method="post" className="inline">
                <button
                  type="submit"
                  className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Sair
                </button>
              </form>
            </div>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
