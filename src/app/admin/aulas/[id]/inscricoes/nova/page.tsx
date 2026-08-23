import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { InscricaoForm } from './InscricaoForm';

export const dynamic = 'force-dynamic';

export default async function NovaInscricaoPage({ params }: { params: { id: string } }) {
  const aula = await prisma.aula.findUnique({
    where: { id: params.id },
    include: { course: true },
  });
  if (!aula) notFound();

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <a href={`/admin/aulas/${aula.id}`} className="text-sm text-blue-600">
        ← Voltar para a aula
      </a>
      <h1 className="text-3xl font-bold mt-2 mb-2">Adicionar inscrito</h1>
      <p className="text-sm text-gray-600 mb-6">
        <strong>{aula.course.name}</strong> ·{' '}
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