import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CursoForm } from '../../CursoForm';

export const dynamic = 'force-dynamic';

export default async function CursoEditarPage({ params }: { params: { id: string } }) {
  const curso = await prisma.course.findUnique({ where: { id: params.id } });
  if (!curso) notFound();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <Link
        href={`/admin/cursos/${curso.id}`}
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para {curso.name}
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-6">Editar curso</h1>
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
