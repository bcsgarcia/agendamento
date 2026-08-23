export const dynamic = 'force-dynamic';
export const revalidate = 0;
export default function AdminHome() {
  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">Visão geral da clínica</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <a href="/admin/agenda" className="p-6 bg-white border rounded-lg hover:shadow">
          <div className="text-sm text-gray-500">Agenda</div>
          <div className="text-2xl font-semibold mt-2">Ver bookings →</div>
        </a>
        <a href="/admin/clientes" className="p-6 bg-white border rounded-lg hover:shadow">
          <div className="text-sm text-gray-500">Clientes</div>
          <div className="text-2xl font-semibold mt-2">CRM →</div>
        </a>
        <a href="/admin/fila-urgente" className="p-6 bg-white border rounded-lg hover:shadow">
          <div className="text-sm text-gray-500">Urgências</div>
          <div className="text-2xl font-semibold mt-2">Fila →</div>
        </a>
        <a href="/admin/servicos" className="p-6 bg-white border rounded-lg hover:shadow">
          <div className="text-sm text-gray-500">Serviços</div>
          <div className="text-2xl font-semibold mt-2">Catálogo →</div>
        </a>
        <a href="/admin/cursos" className="p-6 bg-white border rounded-lg hover:shadow">
          <div className="text-sm text-gray-500">Cursos</div>
          <div className="text-2xl font-semibold mt-2">Catálogo →</div>
        </a>
      </div>
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold text-blue-900">Sistema no ar</h2>
        <p className="text-sm text-blue-800 mt-2">Backend conectado ao Postgres. Endpoints REST prontos pros tools do Fluxi.</p>
      </div>
    </main>
  );
}
