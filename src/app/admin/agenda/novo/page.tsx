import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canEditInAdmin, type Role } from '@/lib/permissions';
import { BookingForm, type CustomerOption, type ServiceOption } from '../BookingForm';

export const dynamic = 'force-dynamic';

export default async function NovoBookingPage() {
  const actor = await getCurrentUser();
  if (actor && !canEditInAdmin(actor.role as Role)) {
    redirect('/admin/agenda?error=forbidden');
  }

  // Busca customers (ordenados por nome, com fallback pro telefone) e
  // services ativos (ordenados por nome). Esses são os dois selects do form.
  const [customersRaw, servicesRaw] = await Promise.all([
    prisma.customer.findMany({
      orderBy: [{ name: 'asc' }, { phone: 'asc' }],
      select: { id: true, name: true, phone: true },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, priceCents: true, durationMin: true },
    }),
  ]);

  const customers: CustomerOption[] = customersRaw.map((c) => ({
    id: c.id,
    // Mostra nome se tiver, senão telefone — facilita identificar quando o
    // cliente só tem número cadastrado (regra de Bruno: "WhatsApp é o ID").
    label: c.name ? `${c.name} (${c.phone})` : c.phone,
  }));

  const services: ServiceOption[] = servicesRaw.map((s) => ({
    id: s.id,
    name: s.name,
    priceCents: s.priceCents,
    durationMin: s.durationMin,
  }));

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <Link
        href="/admin/agenda"
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para agenda
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-6">Novo booking</h1>
      <BookingForm
        mode="create"
        redirectPath="/admin/agenda/{id}"
        cancelHref="/admin/agenda"
        customers={customers}
        services={services}
        defaultValues={{
          customerId: '',
          serviceId: '',
          startsAt: '',
          endsAt: '',
          status: 'scheduled',
          notes: '',
        }}
      />
    </main>
  );
}
