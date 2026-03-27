import { addMinutes } from 'date-fns';
import type { Agendamento } from '../../../types';

export const getDuracaoEfetivaMinutos = (
  duracaoServicoMinutos: number | undefined,
  slotDurationMinutes: number
) => {
  const base = Number.isFinite(duracaoServicoMinutos as number)
    ? Number(duracaoServicoMinutos)
    : slotDurationMinutes;
  return Math.max(slotDurationMinutes, base);
};

export const getIntervaloAgendamento = (dataHora: Date | string, duracaoMinutos: number) => {
  const start = dataHora instanceof Date ? dataHora : new Date(dataHora);
  const end = addMinutes(start, duracaoMinutos);
  return { start, end };
};

/** [start, end) em ms — sobreposição se houver qualquer instante em comum */
export const intervalosTemporaisSobrepostos = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) => startA.getTime() < endB.getTime() && startB.getTime() < endA.getTime();

/** Só estes status reservam o horário na agenda. */
const agendamentoBloqueiaGrade = (a: Agendamento) =>
  a.status === 'pendente' || a.status === 'confirmado';

export const getDuracaoAgendamentoNaGrade = (
  agendamento: Agendamento,
  slotDurationMinutes: number
) =>
  getDuracaoEfetivaMinutos(
    agendamento.servicos?.duracao != null ? Number(agendamento.servicos.duracao) : undefined,
    slotDurationMinutes
  );

export const encontrarConflitoDeHorario = (params: { inicio: Date; fim: Date; candidatoId?: string; existentes: Agendamento[]; slotDurationMinutes: number }): Agendamento | null => {
  const { inicio, fim, candidatoId, existentes, slotDurationMinutes } = params;

  for (const outro of existentes) {
    if (!agendamentoBloqueiaGrade(outro)) {
      continue;
    }
    if (candidatoId && outro.id === candidatoId) {
      continue;
    }

    const duracao = getDuracaoAgendamentoNaGrade(outro, slotDurationMinutes);
    const { start: oStart, end: oEnd } = getIntervaloAgendamento(outro.data_hora, duracao);

    if (intervalosTemporaisSobrepostos(inicio, fim, oStart, oEnd)) {
      return outro;
    }
  }

  return null;
};

export const mensagemConflitoHorario = (conflito: Agendamento) => {
  const hora = new Date(conflito.data_hora);
  const hh = String(hora.getHours()).padStart(2, '0');
  const mm = String(hora.getMinutes()).padStart(2, '0');
  const nome = conflito.cliente_nome?.trim() || 'Cliente';
  return `Este horário se sobrepõe ao agendamento de ${nome} às ${hh}:${mm}. Escolha outro horário ou serviço.`;
};
