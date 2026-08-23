import Link from 'next/link';
import { ServicoForm } from '../ServicoForm';

export const dynamic = 'force-dynamic';

export default function ServicoNovoPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <Link
        href="/admin/servicos"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para serviços
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-6">Novo serviço</h1>
      <ServicoForm mode="create" redirectPath="/admin/servicos/{id}" />
    </main>
  );
}
