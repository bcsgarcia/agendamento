// Server Actions para mutação de Booking (agenda).
// Usadas pelos formulários client-side em src/app/admin/agenda/*.
// 'use server' é declarado no topo — toda função exportada vira endpoint POST interno.
//
// Importante: server actions NÃO passam pelo middleware HTTP (executam no runtime
// do Next). Auth verificada via getCurrentUser() — se não houver, retorna
// { ok: false, error: 'unauthorized' }. A validação de status, FKs e range de
// datas é feita aqui, ANTES do write, pra retornar erro legível ao usuário
// em vez de explodir no Postgres.

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'admin_session';

// Status permitidos no enum do schema Booking (default: "scheduled").
// Não há enum nativo no Prisma schema — string livre validada aqui.
// "no_show" também é aceito (cliente compareceu, não apareceu).
const ALLOWED_STATUSES = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const;
type BookingStatus = (typeof ALLOWED_STATUSES)[number];

async function requireUser(): Promise<{ id: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // Validação leve: presença do cookie. (Middleware HTTP já bloqueia requisições
  // sem cookie; aqui só evitamos server actions "soltas" sem cookie.)
  const user = await prisma.user.findFirst({
    where: { sessions: { some: { sessionToken: token, expires: { gt: new Date() } } } },
    select: { id: true },
  });
  return user;
}

function parseDateOrNull(raw: string, field: string): { ok: true; date: Date | null } | { ok: false; error: string } {
  if (!raw) return { ok: true, date: null };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { ok: false, error: `${field} inválida` };
  return { ok: true, date: d };
}

// ============ Booking ============

export async function createBookingAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const customerId = String(formData.get('customerId') ?? '');
  const serviceId = String(formData.get('serviceId') ?? '');
  const startsAtRaw = String(formData.get('startsAt') ?? '');
  const endsAtRaw = String(formData.get('endsAt') ?? '');
  const statusRaw = String(formData.get('status') ?? 'scheduled');
  const notes = String(formData.get('notes') ?? '').trim();

  if (!customerId) return { ok: false, error: 'cliente é obrigatório' };
  if (!serviceId) return { ok: false, error: 'serviço é obrigatório' };
  if (!startsAtRaw) return { ok: false, error: 'data/hora início é obrigatória' };
  if (!endsAtRaw) return { ok: false, error: 'data/hora fim é obrigatória' };
  if (!ALLOWED_STATUSES.includes(statusRaw as BookingStatus)) {
    return { ok: false, error: `status inválido: ${statusRaw}` };
  }

  const s1 = parseDateOrNull(startsAtRaw, 'data/hora início');
  if (!s1.ok) return { ok: false, error: s1.error };
  const s2 = parseDateOrNull(endsAtRaw, 'data/hora fim');
  if (!s2.ok) return { ok: false, error: s2.error };
  const startsAt = s1.date!;
  const endsAt = s2.date!;
  if (endsAt <= startsAt) {
    return { ok: false, error: 'data/hora fim deve ser depois do início' };
  }

  // Validar FKs antes do write pra dar mensagem útil (sem isso, prisma lança
  // P2003 com mensagem críptica).
  const [customer, service] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } }),
    prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } }),
  ]);
  if (!customer) return { ok: false, error: 'cliente não encontrado' };
  if (!service) return { ok: false, error: 'serviço não encontrado' };

  try {
    const booking = await prisma.booking.create({
      data: {
        customerId,
        serviceId,
        startsAt,
        endsAt,
        status: statusRaw,
        notes: notes || null,
      },
    });
    revalidatePath('/admin/agenda');
    return { ok: true, id: booking.id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Foreign key constraint')) {
      return { ok: false, error: 'cliente ou serviço não encontrado' };
    }
    return { ok: false, error: msg };
  }
}

export async function updateBookingAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  const data: Prisma.BookingUpdateInput = {};

  const customerId = String(formData.get('customerId') ?? '');
  const serviceId = String(formData.get('serviceId') ?? '');
  const startsAtRaw = String(formData.get('startsAt') ?? '').trim();
  const endsAtRaw = String(formData.get('endsAt') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? '').trim();
  const notesRaw = String(formData.get('notes') ?? '').trim();

  if (customerId) {
    const exists = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!exists) return { ok: false, error: 'cliente não encontrado' };
    data.customer = { connect: { id: customerId } };
  }
  if (serviceId) {
    const exists = await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } });
    if (!exists) return { ok: false, error: 'serviço não encontrado' };
    data.service = { connect: { id: serviceId } };
  }
  if (startsAtRaw) {
    const r = parseDateOrNull(startsAtRaw, 'data/hora início');
    if (!r.ok) return { ok: false, error: r.error };
    data.startsAt = r.date!;
  }
  if (endsAtRaw) {
    const r = parseDateOrNull(endsAtRaw, 'data/hora fim');
    if (!r.ok) return { ok: false, error: r.error };
    data.endsAt = r.date!;
  }
  // Se o caller passou startsAt/endsAt, validar range. Não falhamos aqui se
  // o caller passou só um dos dois — a página de detalhe só passa ambos.
  if (data.startsAt && data.endsAt && (data.endsAt as Date) <= (data.startsAt as Date)) {
    return { ok: false, error: 'data/hora fim deve ser depois do início' };
  }
  if (statusRaw) {
    if (!ALLOWED_STATUSES.includes(statusRaw as BookingStatus)) {
      return { ok: false, error: `status inválido: ${statusRaw}` };
    }
    data.status = statusRaw;
    // Quando transita pra "confirmed" sem confirmedAt, seta automaticamente.
    // O caller pode sobrescrever passando "confirmedAt" manualmente, se quiser.
    if (statusRaw === 'confirmed' && !String(formData.get('confirmedAt') ?? '')) {
      data.confirmedAt = new Date();
    }
  }
  // Notes: vazio = NULL, valor = string. (Mesmo padrão do maxAlunos no Aula.)
  // Sem este branch explícito, update não conseguiria limpar notes preenchidas.
  if (notesRaw === '') {
    data.notes = null;
  } else if (notesRaw !== undefined) {
    data.notes = notesRaw;
  }

  try {
    await prisma.booking.update({ where: { id }, data });
    revalidatePath('/admin/agenda');
    revalidatePath(`/admin/agenda/${id}`);
    return { ok: true, id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'booking não encontrado' };
    }
    return { ok: false, error: msg };
  }
}

export async function deleteBookingAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  try {
    await prisma.booking.delete({ where: { id } });
    revalidatePath('/admin/agenda');
    return { ok: true };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to delete does not exist')) {
      return { ok: false, error: 'booking não encontrado' };
    }
    return { ok: false, error: msg };
  }
}

// Actions auxiliares de status (atalhos da página de detalhe).
// Não fazem validação complexa — só trocam status (com side-effect no
// confirmedAt quando aplicável).

export async function confirmBookingAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  try {
    await prisma.booking.update({
      where: { id },
      data: { status: 'confirmed', confirmedAt: new Date() },
    });
    revalidatePath('/admin/agenda');
    revalidatePath(`/admin/agenda/${id}`);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: String(e) };
  }
}

export async function cancelBookingAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  try {
    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    revalidatePath('/admin/agenda');
    revalidatePath(`/admin/agenda/${id}`);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: String(e) };
  }
}
