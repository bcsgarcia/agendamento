import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canEditInAdmin, type Role } from '@/lib/permissions';
import { InscricaoForm } from './InscricaoForm';

export const dynamic = 'force-dynamic';

export default async function NovaInscricaoPage({ params }: { params: { id: string } }) {
  const actor = await getCurrentUser();
  if (actor && !canEditInAdmin(actor.role as Role)) {
    redirect(`/admin/aulas/${params.id}?error=forbidden`);
  }

  const aula = await prisma.aula.findUnique({
    where: { id: params.id },
    include: { course: true },
  });
  if (!aula) notFound();

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <Link
        href={`/admin/aulas/${aula.id}`}
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para a aula
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-2">Adicionar inscrito</h1>
      <p className="text-body text-text-muted mb-6">
        <strong className="text-text">{aula.course.name}</strong> ·{' '}
        {new Date(aula.dataInicio).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </p>
      <InscricaoForm
        aulaId={aula.id}
        redirectPath="/admin/aulas/{id}"
      />
    </main>
  );
}
