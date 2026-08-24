import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canEditInAdmin, type Role } from '@/lib/permissions';
import { CursoForm } from '../CursoForm';

export const dynamic = 'force-dynamic';

export default async function CursoNovoPage() {
  const actor = await getCurrentUser();
  if (actor && !canEditInAdmin(actor.role as Role)) {
    redirect('/admin/cursos?error=forbidden');
  }

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <Link
        href="/admin/cursos"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para cursos
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-6">Novo curso</h1>
      <CursoForm
        mode="create"
        redirectPath="/admin/cursos/{id}"
      />
    </main>
  );
}
