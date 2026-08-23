// Helper: recalcula vagasOcupadas de uma Aula contando Inscricoes ativas (não canceladas).
// Chamado após qualquer create/update/delete de Inscricao.
// Também recalcula status da aula: se vagasOcupadas >= maxAlunos (do curso) => 'lotada'.
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

  // Determina status automaticamente (apenas se aula ainda não foi cancelada/concluída manualmente)
  let novoStatus = aula.status;
  if (aula.status === 'aberta' || aula.status === 'lotada') {
    if (aula.course.maxAlunos && count >= aula.course.maxAlunos) {
      novoStatus = 'lotada';
    } else if (aula.status === 'lotada' && count < (aula.course.maxAlunos ?? Infinity)) {
      novoStatus = 'aberta';
    }
  }

  await prisma.aula.update({
    where: { id: aulaId },
    data: { vagasOcupadas: count, status: novoStatus },
  });

  return { vagasOcupadas: count, status: novoStatus };
}