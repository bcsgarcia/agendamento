// Server Actions para mutação de Customer (cliente).
// Usadas pelos formulários client-side em src/app/admin/clientes/*
// 'use server' é declarado no topo — toda função exportada vira endpoint POST interno.
//
// Importante: NÃO passamos pelo middleware HTTP aqui (server actions são executadas
// no runtime do Next, não como request HTTP). A auth é verificada via getCurrentUser
// indireto (requireUser local abaixo). Mesma checagem usada em src/lib/course-actions.ts.
//
// Decisões de design (especificadas no body da task):
//   - `phone` é unique — conflito tratado via try/catch da Prisma.
//   - `tags` no DB é String[]; no form vira texto com vírgulas → split/trim/filter.
//   - `birthDate` é Date válida; string vazia → null.
//   - `preferredTime` é string livre; select com opções pré-definidas no form.
//   - Delete bloqueia se cliente tem bookings (FK); caller precisa excluir antes.

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'admin_session';

async function requireUser(): Promise<{ id: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await prisma.user.findFirst({
    where: { sessions: { some: { sessionToken: token, expires: { gt: new Date() } } } },
    select: { id: true },
  });
  return user;
}

/** Converte string de tags separadas por vírgula em array limpo. */
function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

// ============ Customer ============

export async function createCustomerAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const phone = String(formData.get('phone') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const birthDateStr = String(formData.get('birthDate') ?? '').trim();
  const allergies = String(formData.get('allergies') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const preferredTime = String(formData.get('preferredTime') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '');

  if (!phone) return { ok: false, error: 'telefone é obrigatório' };

  let birthDate: Date | null = null;
  if (birthDateStr) {
    const d = new Date(birthDateStr);
    if (isNaN(d.getTime())) return { ok: false, error: 'data de nascimento inválida' };
    birthDate = d;
  }

  const tags = parseTags(tagsRaw);

  try {
    const customer = await prisma.customer.create({
      data: {
        phone,
        name: name || null,
        birthDate,
        allergies: allergies || null,
        notes: notes || null,
        preferredTime: preferredTime || null,
        tags,
      },
    });
    revalidatePath('/admin/clientes');
    return { ok: true, id: customer.id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Unique constraint') && msg.includes('phone')) {
      return { ok: false, error: `telefone "${phone}" já cadastrado` };
    }
    return { ok: false, error: msg };
  }
}

export async function updateCustomerAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  const data: Record<string, unknown> = {};

  const phone = String(formData.get('phone') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const birthDateStr = String(formData.get('birthDate') ?? '').trim();
  const allergies = String(formData.get('allergies') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const preferredTime = String(formData.get('preferredTime') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '');

  if (!phone) return { ok: false, error: 'telefone é obrigatório' };
  data.phone = phone;
  data.name = name || null;

  if (birthDateStr) {
    const d = new Date(birthDateStr);
    if (isNaN(d.getTime())) return { ok: false, error: 'data de nascimento inválida' };
    data.birthDate = d;
  } else {
    // Vazio → null explícito (limpa o campo)
    data.birthDate = null;
  }

  data.allergies = allergies || null;
  data.notes = notes || null;
  data.preferredTime = preferredTime || null;
  data.tags = parseTags(tagsRaw);

  try {
    await prisma.customer.update({ where: { id }, data });
    revalidatePath('/admin/clientes');
    revalidatePath(`/admin/clientes/${id}`);
    return { ok: true, id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Unique constraint') && msg.includes('phone')) {
      return { ok: false, error: `telefone "${phone}" já cadastrado` };
    }
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'cliente não encontrado' };
    }
    return { ok: false, error: msg };
  }
}

export async function deleteCustomerAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  // Bloqueia exclusão se há bookings associados — caller precisa excluí-los antes.
  const bookingsCount = await prisma.booking.count({ where: { customerId: id } });
  if (bookingsCount > 0) {
    return {
      ok: false,
      error: `cliente tem ${bookingsCount} agendamento(s) — exclua-os antes de remover o cliente`,
    };
  }

  // ConversationState é 1-1 (relation) — apaga antes pra evitar violar FK.
  // Booking já foi barrado acima; ConversationState é o único filho restante.
  await prisma.conversationState.deleteMany({ where: { customerId: id } }).catch(() => {});

  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath('/admin/clientes');
    return { ok: true };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'cliente não encontrado' };
    }
    return { ok: false, error: msg };
  }
}