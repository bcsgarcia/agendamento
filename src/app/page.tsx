export const dynamic = 'force-dynamic';
export const revalidate = 0;
export default function Home() {
  return (
    <main className="p-8 max-w-2xl mx-auto text-center mt-12">
      <h1 className="text-4xl font-bold">Sistema de Agendamento</h1>
      <p className="text-gray-600 mt-4 mb-8">Backend Next.js com API REST + Prisma + Postgres</p>
      <a href="/admin" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Ir para o Dashboard →
      </a>
    </main>
  );
}
