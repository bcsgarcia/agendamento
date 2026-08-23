// Server Actions para mutação de Curso/Aula/Inscricao
// Usadas pelos formulários client-side em src/app/admin/...
// 'use server' é declarado no topo — toda função exportada vira endpoint POST interno.
//
// Importante: NÃO passamos pelo middleware HTTP aqui (server actions são executadas
// no runtime do Next, não como request HTTP). A auth é verificada via getCurrentUser()
// — se não houver usuário, retornamos { ok: false, error: 'unauthorized' }.

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { recalcAulaVagas } from '@/lib/course-helpers';

const SESSION_COOKIE = 'admin_session';

async function requireUser(): Promise<{ id: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // Validação leve: presença do cookie. (O middleware HTTP já bloqueia requisições sem cookie;
  // aqui só evitamos server actions "soltas" sem cookie.)
  const user = await prisma.user.findFirst({
    where: { sessions: { some: { sessionToken: token, expires: { gt: new Date() } } } },
    select: { id: true },
  });
  return user;
}

// ============ Curso ============

export async function createCursoAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const slug = String(formData.get('slug') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const modality = String(formData.get('modality') ?? 'presencial').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priceStr = String(formData.get('price') ?? '0').trim();
  const purchaseUrl = String(formData.get('purchaseUrl') ?? '').trim();
  const cargaHorariaStr = String(formData.get('cargaHorariaHoras') ?? '').trim();
  const maxAlunosStr = String(formData.get('maxAlunos') ?? '').trim();
  const formaPagamento = String(formData.get('formaPagamento') ?? '').trim();
  const active = formData.get('active') === 'on';

  if (!slug || !name || !description) {
    return { ok: false, error: 'slug, nome e descrição são obrigatórios' };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: 'slug inválido: use só letras minúsculas, números e hífen' };
  }

  const priceCents = Math.round(parseFloat(priceStr.replace(',', '.')) * 100);
  if (isNaN(priceCents) || priceCents < 0) return { ok: false, error: 'preço inválido' };

  const cargaHorariaHoras = cargaHorariaStr ? parseInt(cargaHorariaStr, 10) : null;
  if (cargaHorariaHoras !== null && (isNaN(cargaHorariaHoras) || cargaHorariaHoras <= 0)) {
    return { ok: false, error: 'carga horária inválida' };
  }
  const maxAlunos = maxAlunosStr ? parseInt(maxAlunosStr, 10) : null;
  if (maxAlunos !== null && (isNaN(maxAlunos) || maxAlunos <= 0)) {
    return { ok: false, error: 'max alunos inválido' };
  }
  if (purchaseUrl && !/^https?:\/\//.test(purchaseUrl)) {
    return { ok: false, error: 'link de pagamento deve começar com http:// ou https://' };
  }

  try {
    const curso = await prisma.course.create({
      data: {
        slug,
        name,
        modality,
        description,
        priceCents,
        cargaHorariaHoras,
        maxAlunos,
        formaPagamento: formaPagamento || null,
        purchaseUrl: purchaseUrl || '',
        active,
      },
    });
    revalidatePath('/admin/cursos');
    return { ok: true, id: curso.id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return { ok: false, error: `slug "${slug}" já existe` };
    }
    return { ok: false, error: msg };
  }
}

export async function updateCursoAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  const data: Record<string, unknown> = {};
  const slug = String(formData.get('slug') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const modality = String(formData.get('modality') ?? 'presencial').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priceStr = String(formData.get('price') ?? '').trim();
  const purchaseUrl = String(formData.get('purchaseUrl') ?? '').trim();
  const cargaHorariaStr = String(formData.get('cargaHorariaHoras') ?? '').trim();
  const maxAlunosStr = String(formData.get('maxAlunos') ?? '').trim();
  const formaPagamento = String(formData.get('formaPagamento') ?? '').trim();
  const active = formData.get('active') === 'on';

  if (slug) {
    if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false, error: 'slug inválido' };
    data.slug = slug;
  }
  if (name) data.name = name;
  if (modality) data.modality = modality;
  if (description) data.description = description;
  if (priceStr) {
    const priceCents = Math.round(parseFloat(priceStr.replace(',', '.')) * 100);
    if (isNaN(priceCents) || priceCents < 0) return { ok: false, error: 'preço inválido' };
    data.priceCents = priceCents;
  }
  if (purchaseUrl !== '') {
    if (purchaseUrl && !/^https?:\/\//.test(purchaseUrl)) return { ok: false, error: 'link inválido' };
    data.purchaseUrl = purchaseUrl;
  }
  if (cargaHorariaStr) {
    const n = parseInt(cargaHorariaStr, 10);
    if (isNaN(n) || n <= 0) return { ok: false, error: 'carga horária inválida' };
    data.cargaHorariaHoras = n;
  }
  if (maxAlunosStr) {
    const n = parseInt(maxAlunosStr, 10);
    if (isNaN(n) || n <= 0) return { ok: false, error: 'max alunos inválido' };
    data.maxAlunos = n;
  }
  data.formaPagamento = formaPagamento || null;
  data.active = active;

  try {
    await prisma.course.update({ where: { id }, data: data as Prisma.CourseUpdateInput });
    revalidatePath('/admin/cursos');
    revalidatePath(`/admin/cursos/${id}`);
    return { ok: true, id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return { ok: false, error: `slug "${slug}" já existe` };
    }
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'curso não encontrado' };
    }
    return { ok: false, error: msg };
  }
}

export async function deactivateCursoAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  try {
    await prisma.course.update({ where: { id }, data: { active: false } });
    revalidatePath('/admin/cursos');
    revalidatePath(`/admin/cursos/${id}`);
    revalidatePath('/api/public/cursos');
    return { ok: true };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'curso não encontrado' };
    }
    return { ok: false, error: msg };
  }
}

// ============ Aula ============

export async function createAulaAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const courseId = String(formData.get('courseId') ?? '');
  const dataInicioStr = String(formData.get('dataInicio') ?? '').trim();
  const dataFimStr = String(formData.get('dataFim') ?? '').trim();
  const local = String(formData.get('local') ?? '').trim();
  const maxAlunosStr = String(formData.get('maxAlunos') ?? '').trim();
  const status = String(formData.get('status') ?? 'aberta').trim();

  if (!courseId || !dataInicioStr || !dataFimStr) {
    return { ok: false, error: 'curso, data início e data fim são obrigatórios' };
  }

  const dataInicio = new Date(dataInicioStr);
  const dataFim = new Date(dataFimStr);
  if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
    return { ok: false, error: 'datas inválidas' };
  }
  if (dataFim < dataInicio) {
    return { ok: false, error: 'data fim deve ser >= data início' };
  }

  let maxAlunos: number | null = null;
  if (maxAlunosStr) {
    const n = parseInt(maxAlunosStr, 10);
    if (isNaN(n) || n <= 0) return { ok: false, error: 'max alunos inválido' };
    maxAlunos = n;
  }

  try {
    const aula = await prisma.aula.create({
      data: {
        courseId,
        dataInicio,
        dataFim,
        local: local || null,
        status,
      },
    });
    revalidatePath(`/admin/cursos/${courseId}`);
    revalidatePath(`/admin/aulas/${aula.id}`);
    return { ok: true, id: aula.id };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Foreign key constraint') && msg.includes('courseId')) {
      return { ok: false, error: 'curso não encontrado' };
    }
    return { ok: false, error: msg };
  }
}

export async function updateAulaAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string; courseId?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  const data: Record<string, unknown> = {};
  const dataInicioStr = String(formData.get('dataInicio') ?? '').trim();
  const dataFimStr = String(formData.get('dataFim') ?? '').trim();
  const local = String(formData.get('local') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  if (dataInicioStr) {
    const d = new Date(dataInicioStr);
    if (isNaN(d.getTime())) return { ok: false, error: 'data início inválida' };
    data.dataInicio = d;
  }
  if (dataFimStr) {
    const d = new Date(dataFimStr);
    if (isNaN(d.getTime())) return { ok: false, error: 'data fim inválida' };
    data.dataFim = d;
  }
  if (data.dataInicio && data.dataFim && (data.dataFim as Date) < (data.dataInicio as Date)) {
    return { ok: false, error: 'data fim deve ser >= data início' };
  }
  data.local = local || null;
  if (status) data.status = status;

  try {
    const updated = await prisma.aula.update({
      where: { id },
      data: data as Prisma.AulaUpdateInput,
      select: { id: true, courseId: true },
    });
    revalidatePath(`/admin/aulas/${id}`);
    revalidatePath(`/admin/cursos/${updated.courseId}`);
    return { ok: true, id, courseId: updated.courseId };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'aula não encontrada' };
    }
    return { ok: false, error: msg };
  }
}

export async function cancelAulaAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string; courseId?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  try {
    const updated = await prisma.aula.update({
      where: { id },
      data: { status: 'cancelada' },
      select: { id: true, courseId: true },
    });
    revalidatePath(`/admin/aulas/${id}`);
    revalidatePath(`/admin/cursos/${updated.courseId}`);
    return { ok: true, id: updated.id, courseId: updated.courseId };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes('Record to update not found')) {
      return { ok: false, error: 'aula não encontrada' };
    }
    return { ok: false, error: msg };
  }
}

// ============ Inscricao ============

export async function createInscricaoAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const aulaId = String(formData.get('aulaId') ?? '');
  const nomeInscrito = String(formData.get('nomeInscrito') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const telefone = String(formData.get('telefone') ?? '').trim();
  const valorPagoStr = String(formData.get('valorPago') ?? '').trim();
  const sinalPago = formData.get('sinalPago') === 'on';
  const dataSinalStr = String(formData.get('dataSinal') ?? '').trim();
  const statusPagamento = String(formData.get('statusPagamento') ?? 'pendente').trim();

  if (!aulaId || !nomeInscrito) {
    return { ok: false, error: 'nome do inscrito e aula são obrigatórios' };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'email inválido' };
  }
  let valorPago: number | null = null;
  if (valorPagoStr) {
    const v = Math.round(parseFloat(valorPagoStr.replace(',', '.')) * 100);
    if (isNaN(v) || v < 0) return { ok: false, error: 'valor pago inválido' };
    valorPago = v;
  }
  let dataSinal: Date | null = null;
  if (dataSinalStr) {
    const d = new Date(dataSinalStr);
    if (isNaN(d.getTime())) return { ok: false, error: 'data do sinal inválida' };
    dataSinal = d;
  }

  // Verifica aula existe e não está cancelada/concluída
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    select: { id: true, status: true, course: { select: { maxAlunos: true } } },
  });
  if (!aula) return { ok: false, error: 'aula não encontrada' };
  if (aula.status === 'cancelada' || aula.status === 'concluida') {
    return { ok: false, error: `não é possível inscrever em aula ${aula.status}` };
  }

  try {
    const inscricao = await prisma.inscricao.create({
      data: {
        aulaId,
        nomeInscrito,
        email: email || null,
        telefone: telefone || null,
        valorPago,
        sinalPago,
        dataSinal,
        statusPagamento,
      },
    });
    // Recalcula vagas — se aula lotar, status vira 'lotada' automaticamente
    try {
      await recalcAulaVagas(aulaId);
    } catch {
      // não bloqueia — vaga é indicador secundário
    }
    revalidatePath(`/admin/aulas/${aulaId}`);
    return { ok: true, id: inscricao.id };
  } catch (e: unknown) {
    return { ok: false, error: String(e) };
  }
}

export async function updateInscricaoAction(formData: FormData): Promise<{ ok: boolean; error?: string; aulaId?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    select: { aulaId: true },
  });
  if (!inscricao) return { ok: false, error: 'inscrição não encontrada' };

  const data: Record<string, unknown> = {};
  const nomeInscrito = String(formData.get('nomeInscrito') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const telefone = String(formData.get('telefone') ?? '').trim();
  const valorPagoStr = String(formData.get('valorPago') ?? '').trim();
  const sinalPago = formData.get('sinalPago') === 'on';
  const statusPagamento = String(formData.get('statusPagamento') ?? '').trim();
  const dataSinalStr = String(formData.get('dataSinal') ?? '').trim();
  const dataPagamentoFinalStr = String(formData.get('dataPagamentoFinal') ?? '').trim();

  if (nomeInscrito) data.nomeInscrito = nomeInscrito;
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'email inválido' };
    data.email = email;
  }
  if (telefone !== '') data.telefone = telefone || null;
  if (valorPagoStr) {
    const v = Math.round(parseFloat(valorPagoStr.replace(',', '.')) * 100);
    if (isNaN(v) || v < 0) return { ok: false, error: 'valor pago inválido' };
    data.valorPago = v;
  }
  if (dataSinalStr) {
    const d = new Date(dataSinalStr);
    if (isNaN(d.getTime())) return { ok: false, error: 'data do sinal inválida' };
    data.dataSinal = d;
  } else if (dataSinalStr === '') {
    data.dataSinal = null;
  }
  if (dataPagamentoFinalStr) {
    const d = new Date(dataPagamentoFinalStr);
    if (isNaN(d.getTime())) return { ok: false, error: 'data pagamento final inválida' };
    data.dataPagamentoFinal = d;
  } else if (dataPagamentoFinalStr === '') {
    data.dataPagamentoFinal = null;
  }

  // Auto-fill: se mudou pra sinal_pago, marca sinalPago=true e preenche dataSinal
  if (statusPagamento === 'sinal_pago') {
    data.sinalPago = true;
    if (!dataSinalStr) data.dataSinal = new Date();
  } else if (statusPagamento === 'quitado') {
    data.sinalPago = true;
    if (!dataSinalStr) data.dataSinal = new Date();
    data.dataPagamentoFinal = new Date();
  } else if (statusPagamento === 'cancelado') {
    data.sinalPago = false;
    data.dataSinal = null;
    data.dataPagamentoFinal = null;
  }
  data.sinalPago = sinalPago;
  if (statusPagamento) data.statusPagamento = statusPagamento;

  try {
    await prisma.inscricao.update({ where: { id }, data });
    try {
      await recalcAulaVagas(inscricao.aulaId);
    } catch {
      // idem
    }
    revalidatePath(`/admin/aulas/${inscricao.aulaId}`);
    return { ok: true, aulaId: inscricao.aulaId };
  } catch (e: unknown) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteInscricaoAction(formData: FormData): Promise<{ ok: boolean; error?: string; aulaId?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id ausente' };

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    select: { aulaId: true },
  });
  if (!inscricao) return { ok: false, error: 'inscrição não encontrada' };

  try {
    await prisma.inscricao.delete({ where: { id } });
    try {
      await recalcAulaVagas(inscricao.aulaId);
    } catch {
      // idem
    }
    revalidatePath(`/admin/aulas/${inscricao.aulaId}`);
    return { ok: true, aulaId: inscricao.aulaId };
  } catch (e: unknown) {
    return { ok: false, error: String(e) };
  }
}

// Helpers para navegação programática após sucesso (server action não pode retornar URL pro client)
// Em vez disso, as páginas chamam a action e fazem router.push() no client.