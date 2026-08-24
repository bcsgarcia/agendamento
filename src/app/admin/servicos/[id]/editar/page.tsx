import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canEditInAdmin, type Role } from '@/lib/permissions';
import { ServicoForm } from '../../ServicoForm';

export const dynamic = 'force-dynamic';

export default async function ServicoEditarPage({
  params,
}: {
  params: { id: string };
}) {
  const actor = await getCurrentUser();
  if (actor && !canEditInAdmin(actor.role as Role)) {
    redirect('/admin/servicos?error=forbidden');
  }

  const servico = await prisma.service.findUnique({ where: { id: params.id } });
  if (!servico) notFound();

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <Link
        href={`/admin/servicos/${servico.id}`}
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para {servico.name}
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-6">Editar serviço</h1>
      <ServicoForm
        mode="edit"
        initial={{
          id: servico.id,
          slug: servico.slug,
          name: servico.name,
          description: servico.description,
          durationMin: servico.durationMin,
          priceCents: servico.priceCents,
          active: servico.active,
        }}
        redirectPath="/admin/servicos/{id}"
      />
    </main>
  );
}
