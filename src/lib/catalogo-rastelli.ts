// src/lib/catalogo-rastelli.ts
// Compõe texto consolidado (markdown plain text) com todas as formações Rastelli
// ativas + aulas agendadas. Mesma estrutura semântica do `catalogo-rastelli` RAG
// que existia no `agent-atendimento-andy.md`, mas sempre fresca (do banco).
//
// Usado por:
//   - /api/public/catalogo-rastelli (endpoint consumido pelo Fluxi)
//   - admin (futuro botão "ver catálogo consolidado" pra Bruno copiar manualmente)
import { prisma } from '@/lib/db';
import { formatEUR } from '@/lib/helpers';

export interface CatalogoRastelliOptions {
  /** Filtrar por slug ou nome (case-insensitive). Se null, retorna tudo. */
  filtro?: string | null;
}

export interface CatalogoRastelliResult {
  texto: string;
  cursos_total: number;
  cursos_incluidos: number;
  gerado_em: string;
}

/**
 * Formata data ISO pra pt-PT (DD/MM/YYYY HH:mm).
 */
function fmtData(d: Date): string {
  return d.toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Gera o texto consolidado do catálogo Rastelli.
 * Estrutura: cabeçalho → bloco por curso → bloco de objeções/transbordo.
 */
export async function gerarCatalogoRastelliTexto(
  opts: CatalogoRastelliOptions = {},
): Promise<CatalogoRastelliResult> {
  const filtro = (opts.filtro ?? '').trim().toLowerCase();
  const whereBase = { active: true };

  const cursos = await prisma.course.findMany({
    where: whereBase,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      modality: true,
      description: true,
      priceCents: true,
      durationMin: true,
      cargaHorariaHoras: true,
      maxAlunos: true,
      formaPagamento: true,
      paymentTerms: true,
      purchaseUrl: true,
      aulas: {
        where: {
          status: { in: ['aberta', 'lotada'] },
          dataFim: { gte: new Date() },
        },
        orderBy: { dataInicio: 'asc' },
        select: {
          id: true,
          dataInicio: true,
          dataFim: true,
          vagasOcupadas: true,
          maxAlunos: true,
          status: true,
          local: true,
        },
      },
    },
  });

  // Aplicar filtro (slug ou nome, case-insensitive)
  const cursosFiltrados = filtro
    ? cursos.filter(
        (c) =>
          c.slug.toLowerCase().includes(filtro) ||
          c.name.toLowerCase().includes(filtro),
      )
    : cursos;

  const linhas: string[] = [];
  linhas.push('# CATÁLOGO RASTELLI PORTUGAL — FORMAÇÕES');
  linhas.push('');
  linhas.push(
    `> Gerado em ${new Date().toLocaleString('pt-PT')} a partir do sistema de agendamento.`,
  );
  if (filtro) {
    linhas.push(`> Filtro aplicado: "${filtro}"`);
  }
  linhas.push('');
  linhas.push('---');
  linhas.push('');

  for (const c of cursosFiltrados) {
    linhas.push(`## FORMAÇÃO — ${c.name.toUpperCase()}`);
    linhas.push(`Slug: ${c.slug}`);
    linhas.push(`Modalidade: ${c.modality}`);
    if (c.durationMin) {
      const horas = Math.floor(c.durationMin / 60);
      const mins = c.durationMin % 60;
      linhas.push(
        `Duração: ${horas ? `${horas}h` : ''}${mins ? ` ${mins}min` : ''}`.trim(),
      );
    }
    if (c.cargaHorariaHoras) {
      linhas.push(`Carga horária: ${c.cargaHorariaHoras}h`);
    }
    linhas.push(`Preço: ${formatEUR(c.priceCents)}`);
    if (c.maxAlunos != null) {
      linhas.push(`Máx. alunos por turma (padrão): ${c.maxAlunos}`);
    }
    if (c.formaPagamento) {
      linhas.push(`Forma de pagamento: ${c.formaPagamento}`);
    }
    if (c.purchaseUrl) {
      linhas.push(`Link de inscrição: ${c.purchaseUrl}`);
    }
    if (c.description) {
      linhas.push('');
      linhas.push('Descrição:');
      // Quebra em linhas curtas pra leitura do LLM
      linhas.push(c.description.replace(/\s+/g, ' ').trim());
    }

    if (c.aulas.length > 0) {
      linhas.push('');
      linhas.push('Próximas turmas abertas:');
      for (const a of c.aulas) {
        const limiteEfetivo = a.maxAlunos ?? c.maxAlunos;
        const vagasDisp =
          limiteEfetivo != null
            ? Math.max(0, limiteEfetivo - a.vagasOcupadas)
            : null;
        linhas.push(
          `- Início: ${fmtData(a.dataInicio)} | Fim: ${fmtData(a.dataFim)}` +
            (a.local ? ` | Local: ${a.local}` : '') +
            (vagasDisp != null
              ? ` | Vagas: ${vagasDisp}/${limiteEfetivo} (${a.status})`
              : ` | Status: ${a.status}`),
        );
      }
    } else {
      linhas.push('');
      linhas.push('Sem turmas abertas no momento — consultar agenda privada.');
    }

    linhas.push('');
    linhas.push('---');
    linhas.push('');
  }

  // Bloco padrão de objeções/transbordo (sempre presente)
  linhas.push('## OPÇÃO DE TRANSBORDO HUMANO');
  linhas.push('Horário comercial: de segunda a sexta, das 10h às 18h de Lisboa.');
  linhas.push('Fora do horário: cliente deixa contacto e a equipa responde na próxima hora útil.');
  linhas.push('');
  linhas.push('---');
  linhas.push('');
  linhas.push('## QUEBRAS DE OBJEÇÃO (respostas-modelo)');
  linhas.push('');
  linhas.push('Objeção: "Está caro"');
  linhas.push('Resposta: "Entendo! E se parcelarmos em x vezes sem juros? Sai apenas [VALOR] por mês. E o retorno é rápido — em poucas aplicações já recuperas o investimento."');
  linhas.push('');
  linhas.push('Objeção: "Vou pensar"');
  linhas.push('Resposta: "Claro, sem pressa! Posso te enviar um vídeo de 1 minuto mostrando o resultado? Às vezes vendo fica mais fácil decidir."');
  linhas.push('');
  linhas.push('Objeção: "Não sei se funciona mesmo"');
  linhas.push('Resposta: "É normal ter essa dúvida! Por isso temos garantia de satisfação. Mais de [X] alunas já aplicaram a técnica com sucesso."');
  linhas.push('');
  linhas.push('Objeção: "Não tenho tempo"');
  linhas.push('Resposta: "Por isso a formação é desenhada para a tua rotina — aulas curtas, acesso quando quiseres, no telemóvel."');
  linhas.push('');
  linhas.push('Objeção: "Vou ver com o meu marido/sócio"');
  linhas.push('Resposta: "Claro! Posso enviar-te um PDF com tudo certinho para analisarem juntos?"');
  linhas.push('');
  linhas.push('Objeção: "Já tenho experiência, não preciso de curso"');
  linhas.push('Resposta: "Que bom que já trabalhas na área! As nossas especializações são justamente para profissionais como tu — técnicas diferentes das convencionais."');
  linhas.push('');
  linhas.push('Objeção: "Não tenho curso iniciante"');
  linhas.push('Resposta: "Tudo bem! Para aproveitar ao máximo, recomendo começar pela formação iniciante. Queres que eu te apresente?"');
  linhas.push('');

  return {
    texto: linhas.join('\n'),
    cursos_total: cursos.length,
    cursos_incluidos: cursosFiltrados.length,
    gerado_em: new Date().toISOString(),
  };
}
