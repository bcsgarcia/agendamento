// Página "Novo cliente" — wrapper server que renderiza o ClienteForm em modo create.

import Link from 'next/link';
import { ClienteForm } from '../ClienteForm';

export const dynamic = 'force-dynamic';

export default function ClienteNovoPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <Link
        href="/admin/clientes"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para clientes
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-6">Novo cliente</h1>
      <ClienteForm mode="create" redirectPath="/admin/clientes/{id}" />
    </main>
  );
}