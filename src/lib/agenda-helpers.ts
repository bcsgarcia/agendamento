// Helpers compartilhados pela feature de Agenda.
// Mantém a formatação de datas/horários consistente entre lista, detalhe e forms.

// Formato esperado pelo <input type="datetime-local">: YYYY-MM-DDTHH:MM (LOCAL).
// Usa componentes locais (getFullYear, etc.) — não toISOString — pra que o
// valor mostrado no input seja o que o usuário vê na agenda (fuso horário
// do navegador/server).
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function fmtTime(d: Date): string {
  return new Date(d).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDateTime(d: Date): string {
  return `${fmtDate(d)} ${fmtTime(d)}`;
}
