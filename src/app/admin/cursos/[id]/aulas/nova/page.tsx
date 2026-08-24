import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canEditInAdmin, type Role } from '@/lib/permissions';
import { AulaForm } from '@/app/admin/aulas/AulaForm';

export const dynamic = 'force-dynamic';

export default async function NovaAulaPage({ params }: { params: { id: string } }) {
  const actor = await getCurrentUser();
  if (actor && !canEditInAdmin(actor.role as Role)) {
    redirect(`/admin/cursos/${params.id}?error=forbidden`);
  }

  const curso = await prisma.course.findUnique({ where: { id: params.id } });
  if (!curso) notFound();

  // Pré-popula dataInicio = hoje + 7 dias, dataFim = + 1 dia, maxAlunos = curso.maxAlunos
  const now = new Date();
  const defaultInicio = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  defaultInicio.setHours(9, 0, 0, 0);
  const defaultFim = new Date(defaultInicio.getTime() + 24 * 60 * 60 * 1000);
  defaultFim.setHours(18, 0, 0, 0);

  // Formato datetime-local precisa de YYYY-MM-DDTHH:MM no LOCAL time
  const toLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <a href={`/admin/cursos/${curso.id}`} className="text-sm text-accent hover:underline">
        ← Voltar para {curso.name}
      </a>
      <h1 className="text-3xl font-bold mt-2 mb-2">Nova aula</h1>
      <p className="text-sm text-text-muted mb-6">
        Curso: <strong>{curso.name}</strong>
        {curso.maxAlunos && <> · max alunos: {curso.maxAlunos}</>}
      </p>
      <AulaForm
        mode="create"
        courseId={curso.id}
        defaultValues={{
          dataInicio: toLocal(defaultInicio),
          dataFim: toLocal(defaultFim),
          maxAlunos: null,
          maxAlunosDefault: curso.maxAlunos,
          local: '',
          status: 'aberta',
        }}
        redirectPath="/admin/aulas/{id}"
      />
    </main>
  );
}