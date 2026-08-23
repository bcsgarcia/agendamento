// Schemas Zod pra validação dos endpoints de Curso/Aula/Inscricao
import { z } from 'zod';

// Status permitidos (por entidade)
export const AULA_STATUS = ['aberta', 'lotada', 'cancelada', 'concluida'] as const;
export const PAGAMENTO_STATUS = ['pendente', 'sinal_pago', 'quitado', 'cancelado'] as const;

// Helper pra campos opcionais em PATCH (permite undefined e null)
const optionalNullable = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === undefined ? null : v), schema.nullable().optional());

// --- Course ---
export const CourseCreateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'slug deve ter só letras minúsculas, números e hífen'),
  name: z.string().min(1).max(200),
  modality: z.string().min(1).max(100),
  description: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  durationMin: z.number().int().positive().nullable().optional(),
  cargaHorariaHoras: z.number().int().positive().nullable().optional(),
  maxAlunos: z.number().int().positive().nullable().optional(),
  formaPagamento: z.string().max(500).nullable().optional(),
  paymentTerms: z.record(z.string(), z.unknown()).nullable().optional(),
  purchaseUrl: z.string().url().max(500).optional(),
  active: z.boolean().optional(),
});

export const CourseUpdateSchema = CourseCreateSchema.partial().extend({
  // Em PATCH não precisamos do slug como obrigatório
});

// --- Aula ---
export const AulaCreateSchema = z.object({
  dataInicio: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  dataFim: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  local: z.string().max(200).nullable().optional(),
  status: z.enum(AULA_STATUS).optional(),
});

export const AulaUpdateSchema = z.object({
  dataInicio: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  dataFim: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  local: z.string().max(200).nullable().optional(),
  status: z.enum(AULA_STATUS).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'patch precisa de pelo menos 1 campo' }
);

// --- Inscricao ---
export const InscricaoCreateSchema = z.object({
  nomeInscrito: z.string().min(1).max(200),
  email: z.string().email().max(200).nullable().optional(),
  telefone: z.string().max(30).nullable().optional(),
  valorPago: z.number().int().nonnegative().nullable().optional(),
  sinalPago: z.boolean().optional(),
  statusPagamento: z.enum(PAGAMENTO_STATUS).optional(),
});

export const InscricaoUpdateSchema = z.object({
  nomeInscrito: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).nullable().optional(),
  telefone: z.string().max(30).nullable().optional(),
  valorPago: z.number().int().nonnegative().nullable().optional(),
  sinalPago: z.boolean().optional(),
  dataSinal: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable().optional(),
  dataPagamentoFinal: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable().optional(),
  statusPagamento: z.enum(PAGAMENTO_STATUS).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'patch precisa de pelo menos 1 campo' }
);

// Helper: serializa body JSON pra uso nos routes
export async function parseJsonBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; error: string }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, error: 'body inválido: esperado JSON' };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    return { ok: false, error: issues };
  }
  return { ok: true, data: result.data };
}