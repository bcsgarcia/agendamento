import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canEditInAdmin, type Role } from '@/lib/permissions';
import { BookingForm, type CustomerOption, type ServiceOption } from '../../BookingForm';
import { toLocalInput } from '@/lib/agenda-helpers';

export const dynamic = 'force-dynamic';

export default async function BookingEditarPage({ params }: { params: { id: string } }) {
  const actor = await getCurrentUser();
  if (actor && !canEditInAdmin(actor.role as Role)) {
    redirect('/admin/agenda?error=forbidden');
  }

  const [booking, customersRaw, servicesRaw] = await Promise.all([
    prisma.booking.findUnique({ where: { id: params.id } }),
    prisma.customer.findMany({
      orderBy: [{ name: 'asc' }, { phone: 'asc' }],
      select: { id: true, name: true, phone: true },
    }),
    prisma.service.findMany({
      // No edit, mostramos TODOS os services (inclusive inativos) — o usuário
      // pode ter cadastrado o booking com um service que foi desativado depois.
      orderBy: { name: 'asc' },
      select: { id: true, name: true, priceCents: true, durationMin: true },
    }),
  ]);

  if (!booking) notFound();

  const customers: CustomerOption[] = customersRaw.map((c) => ({
    id: c.id,
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
        href={`/admin/agenda/${booking.id}`}
        className="text-label text-text-muted hover:text-accent transition-colors duration-150"
      >
        ← Voltar para o booking
      </Link>
      <h1 className="text-h1 text-text font-semibold mt-2 mb-6">Editar booking</h1>
      <BookingForm
        mode="edit"
        bookingId={booking.id}
        redirectPath="/admin/agenda/{id}"
        cancelHref={`/admin/agenda/${booking.id}`}
        customers={customers}
        services={services}
        defaultValues={{
          customerId: booking.customerId,
          serviceId: booking.serviceId,
          startsAt: toLocalInput(booking.startsAt),
          endsAt: toLocalInput(booking.endsAt),
          status: booking.status,
          notes: booking.notes ?? '',
        }}
      />
    </main>
  );
}
