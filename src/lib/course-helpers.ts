// Helper: recalcula vagasOcupadas de uma Aula contando Inscricoes ativas (não canceladas).
// Chamado após qualquer create/update/delete de Inscricao.
// Também recalcula status da aula: se vagasOcupadas >= maxAlunos efetivo (override da aula
// ou default do curso) => 'lotada'.
import { prisma } from './db';

const STATUS_PAGAMENTO_ATIVOS = ['pendente', 'sinal_pago', 'quitado'];

export async function recalcAulaVagas(aulaId: string): Promise<{ vagasOcupadas: number; status: string }> {
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    include: { course: true },
  });
  if (!aula) throw new Error(`Aula ${aulaId} não encontrada`);

  const count = await prisma.inscricao.count({
    where: {
      aulaId,
      statusPagamento: { in: STATUS_PAGAMENTO_ATIVOS },
    },
  });

  // Limite efetivo: Aula.maxAlunos (override) sobrepõe Course.maxAlunos (default).
  const limiteEfetivo = aula.maxAlunos ?? aula.course.maxAlunos;

  // Determina status automaticamente (apenas se aula ainda não foi cancelada/concluída manualmente)
  let novoStatus = aula.status;
  if (aula.status === 'aberta' || aula.status === 'lotada') {
    if (limiteEfetivo != null && count >= limiteEfetivo) {
      novoStatus = 'lotada';
    } else if (aula.status === 'lotada' && (limiteEfetivo == null || count < limiteEfetivo)) {
      novoStatus = 'aberta';
    }
  }

  await prisma.aula.update({
    where: { id: aulaId },
    data: { vagasOcupadas: count, status: novoStatus },
  });

  return { vagasOcupadas: count, status: novoStatus };
}