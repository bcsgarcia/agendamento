import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Agendamento — Clínica' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav className="bg-white border-b px-8 py-3 flex gap-6 text-sm">
          <Link href="/admin" className="font-semibold">🏥 Clínica</Link>
          <Link href="/admin/agenda" className="text-gray-600 hover:text-gray-900">Agenda</Link>
          <Link href="/admin/clientes" className="text-gray-600 hover:text-gray-900">Clientes</Link>
          <Link href="/admin/servicos" className="text-gray-600 hover:text-gray-900">Serviços</Link>
          <Link href="/admin/fila-urgente" className="text-gray-600 hover:text-gray-900">Urgências</Link>
          <Link href="/admin/feature-flags" className="text-gray-600 hover:text-gray-900">Feature Flags</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
