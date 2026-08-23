// Server Actions para mutação de Service (serviço).
// Usadas pelos formulários client-side em src/app/admin/servicos/*.
// 'use server' é declarado no topo — toda função exportada vira endpoint POST interno.
//
// Auth: verificada via requireUser() lendo cookie admin_session. Se não houver
// usuário válido, retornamos { ok: false, error: 'unauthorized' }.

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

// ============ Service ============

const SLUG_RE = /^[a-z0-9-]+$/;

export async function createServiceAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const slug = String(formData.get('slug') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const durationStr = String(formData.get('duration') ?? '').trim();
  const priceStr = String(formData.get('price') ?? '0').trim();
  const active = formData.get('active') === 'on';

  if (!slug || !name || !description) {
    return { ok: false, error: 'slug, nome e descrição são obrigatórios' };
  }
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: 'slug inválido: use só letras minúsculas, números e hífen' };
  }

  const durationMin = parseInt(durationStr, 10);
  if (isNaN(durationMin) || durationMin <= 0) {
    return { ok: false, error: 'duração inválida (deve ser inteiro positivo, em minutos)' };
  }

  const priceCents = Math.round(parseFloat(priceStr.replace(',', '.')) * 100);
  if (isNaN(priceCents) || priceCents < 0) {
    return { ok: false, error: 'preço inválido' };
  }

  try {
    const service = await prisma.service.create({
      data: { slug, name, description, durationMin, priceCents, active },
    });
    revalidatePath('/admin/servicos');
    revalidatePath('/admin');
    return { ok: true, id: service.id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return { ok: false, error: `slug "${slug}" já existe` };
    }
    return { ok: false, error: msg };
  }
}

export async function updateServiceAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  const data: Record<string, unknown> = {};
  const slug = String(formData.get('slug') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const durationStr = String(formData.get('duration') ?? '').trim();
  const priceStr = String(formData.get('price') ?? '').trim();
  const active = formData.get('active') === 'on';

  if (!slug || !name || !description) {
    return { ok: false, error: 'slug, nome e descrição são obrigatórios' };
  }
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: 'slug inválido: use só letras minúsculas, números e hífen' };
  }
  data.slug = slug;
  data.name = name;
  data.description = description;

  if (durationStr) {
    const n = parseInt(durationStr, 10);
    if (isNaN(n) || n <= 0) return { ok: false, error: 'duração inválida' };
    data.durationMin = n;
  }
  if (priceStr) {
    const priceCents = Math.round(parseFloat(priceStr.replace(',', '.')) * 100);
    if (isNaN(priceCents) || priceCents < 0) return { ok: false, error: 'preço inválido' };
    data.priceCents = priceCents;
  }
  data.active = active;

  try {
    await prisma.service.update({ where: { id }, data: data as never });
    revalidatePath('/admin/servicos');
    revalidatePath(`/admin/servicos/${id}`);
    revalidatePath('/admin');
    return { ok: true, id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return { ok: false, error: `slug "${slug}" já existe` };
    }
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'serviço não encontrado' };
    }
    return { ok: false, error: msg };
  }
}

export async function deleteServiceAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  // Bloqueia exclusão se houver bookings associados — Bruno pode inativar
  // (active=false) em vez de excluir, preservando histórico.
  const bookingsCount = await prisma.booking.count({ where: { serviceId: id } });
  if (bookingsCount > 0) {
    return {
      ok: false,
      error: `não é possível excluir: existem ${bookingsCount} agendamento(s) usando este serviço. Inative-o em vez de excluir.`,
    };
  }

  try {
    await prisma.service.delete({ where: { id } });
    revalidatePath('/admin/servicos');
    revalidatePath('/admin');
    return { ok: true };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'serviço não encontrado' };
    }
    return { ok: false, error: msg };
  }
}
