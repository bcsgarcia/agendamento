// Página "Editar cliente" — wrapper server que renderiza ClienteForm em modo edit.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ClienteForm } from '../../ClienteForm';

export const dynamic = 'force-dynamic';

export default async function ClienteEditarPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer) notFound();

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <Link
        href={`/admin/clientes/${customer.id}`}
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para {customer.name || 'cliente'}
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-6">Editar cliente</h1>
      <ClienteForm
        mode="edit"
        redirectPath="/admin/clientes/{id}"
        initial={{
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
          birthDate: customer.birthDate,
          allergies: customer.allergies,
          notes: customer.notes,
          preferredTime: customer.preferredTime,
          tags: customer.tags,
        }}
      />
    </main>
  );
}