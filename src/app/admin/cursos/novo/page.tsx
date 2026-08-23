import { CursoForm } from '../CursoForm';

export const dynamic = 'force-dynamic';

export default function CursoNovoPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <a href="/admin/cursos" className="text-sm text-blue-600">← Voltar para cursos</a>
      <h1 className="text-3xl font-bold mt-2 mb-6">Novo curso</h1>
      <CursoForm
        mode="create"
        redirectPath="/admin/cursos/{id}"
      />
    </main>
  );
}