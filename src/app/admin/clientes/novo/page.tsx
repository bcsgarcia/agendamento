// Página "Novo cliente" — wrapper server que renderiza o ClienteForm em modo create.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canEditInAdmin, type Role } from '@/lib/permissions';
import { ClienteForm } from '../ClienteForm';

export const dynamic = 'force-dynamic';

export default async function ClienteNovoPage() {
  // RBAC: role "user" não pode criar — redireciona com erro.
  const actor = await getCurrentUser();
  if (actor && !canEditInAdmin(actor.role as Role)) {
    redirect('/admin/clientes?error=forbidden');
  }

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl">
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