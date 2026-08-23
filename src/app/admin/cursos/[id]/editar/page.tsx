import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CursoForm } from '../../CursoForm';

export const dynamic = 'force-dynamic';

export default async function CursoEditarPage({ params }: { params: { id: string } }) {
  const curso = await prisma.course.findUnique({ where: { id: params.id } });
  if (!curso) notFound();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <a href={`/admin/cursos/${curso.id}`} className="text-sm text-blue-600">
        ← Voltar para {curso.name}
      </a>
      <h1 className="text-3xl font-bold mt-2 mb-6">Editar curso</h1>
      <CursoForm
        mode="edit"
        initial={{
          id: curso.id,
          slug: curso.slug,
          name: curso.name,
          modality: curso.modality,
          description: curso.description,
          priceCents: curso.priceCents,
          cargaHorariaHoras: curso.cargaHorariaHoras,
          maxAlunos: curso.maxAlunos,
          formaPagamento: curso.formaPagamento,
          purchaseUrl: curso.purchaseUrl,
          active: curso.active,
        }}
        redirectPath="/admin/cursos/{id}"
      />
    </main>
  );
}