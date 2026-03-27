import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, endOfDay, startOfDay } from 'date-fns';
import { supabase } from '../../../services/api/supabaseClient';
import type { Agendamento as AgendamentoRow } from '../../../types';
import { getHorarioAgendamentoMensagem, isHorarioAgendamentoValido } from '../utils/agendamento';
import { DEFAULT_AGENDA_CONFIG, normalizeAgendaConfig, type AgendaConfig } from '../utils/agendaConfig';
import { encontrarConflitoDeHorario, getDuracaoEfetivaMinutos, getIntervaloAgendamento, mensagemConflitoHorario } from '../utils/agendaConflitos';

interface CreateAgendamentoData {
  data_hora: string;
  cliente_nome: string;
  cliente_telefone: string;
  servico_id: string;
  servico?: string;
  status?: string;
  confirmado_whatsapp?: boolean;
}

interface Agendamento extends CreateAgendamentoData {
  id: string;
  created_at: string;
  servicos?: {
    id: string;
    nome: string;
    preco: number;
    duracao: number;
  } | null;
}

interface Lembrete {
  agendamento_id: string;
  cliente_nome: string;
  mensagem: string;
  data_envio: string;
  status: string;
}

async function fetchAgendamentosDoDiaComServico(dataHoraIso: string): Promise<AgendamentoRow[]> {
  const ref = new Date(dataHoraIso);
  const start = startOfDay(ref).toISOString();
  const end = endOfDay(ref).toISOString();

  const { data, error } = await supabase
    .from('agendamentos')
    .select('id, data_hora, servico_id, status, cliente_nome, servicos(duracao)')
    .gte('data_hora', start)
    .lte('data_hora', end);

  if (error) {
    throw error;
  }

  return (data || []) as unknown as AgendamentoRow[];
}

async function fetchDuracaoServicoMinutos(servicoId: string): Promise<number | undefined> {
  const { data, error } = await supabase.from('servicos').select('duracao').eq('id', servicoId).maybeSingle();

  if (error) {
    throw error;
  }

  return data?.duracao != null ? Number(data.duracao) : undefined;
}

export const useCreateAgendamento = (agendaConfig?: AgendaConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgendamentoData) => {
      if (!isHorarioAgendamentoValido(data.data_hora, agendaConfig)) {
        throw new Error(getHorarioAgendamentoMensagem(agendaConfig, data.data_hora));
      }

      const slotMinutes = normalizeAgendaConfig(agendaConfig ?? DEFAULT_AGENDA_CONFIG).slotDurationMinutes;
      const duracaoServico = await fetchDuracaoServicoMinutos(data.servico_id);
      const duracaoMinutos = getDuracaoEfetivaMinutos(duracaoServico, slotMinutes);
      const { start: inicio, end: fim } = getIntervaloAgendamento(data.data_hora, duracaoMinutos);
      const existentes = await fetchAgendamentosDoDiaComServico(data.data_hora);
      const conflito = encontrarConflitoDeHorario({ inicio, fim, existentes, slotDurationMinutes: slotMinutes });

      if (conflito) {
        throw new Error(mensagemConflitoHorario(conflito));
      }

      const { servico, ...payload } = data;

      const { data: result, error } = await ((supabase
        .from('agendamentos')
        .insert([{
          ...payload,
          status: data.status || 'pendente',
          confirmado_whatsapp: false
        }] as any)
        .select('*')
        .single()) as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useUpdateAgendamento = (agendaConfig?: AgendaConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateAgendamentoData>;
    }) => {
      if (data.data_hora && !isHorarioAgendamentoValido(data.data_hora, agendaConfig)) {
        throw new Error(getHorarioAgendamentoMensagem(agendaConfig, data.data_hora));
      }

      const slotMinutes = normalizeAgendaConfig(agendaConfig ?? DEFAULT_AGENDA_CONFIG).slotDurationMinutes;
      const afetaIntervalo = data.data_hora !== undefined || data.servico_id !== undefined;

      if (afetaIntervalo) {
        const { data: atual, error: atualError } = await supabase
          .from('agendamentos')
          .select('data_hora, servico_id')
          .eq('id', id)
          .single();

        if (atualError) {
          throw atualError;
        }

        const atualRow = atual as unknown as { data_hora: string; servico_id: string | null };
        const dataHoraFinal = (data.data_hora ?? atualRow.data_hora) as string;
        const servicoIdFinal = (data.servico_id ?? atualRow.servico_id) as string;

        if (!isHorarioAgendamentoValido(dataHoraFinal, agendaConfig)) {
          throw new Error(getHorarioAgendamentoMensagem(agendaConfig, dataHoraFinal));
        }

        const duracaoServico = await fetchDuracaoServicoMinutos(servicoIdFinal);
        const duracaoMinutos = getDuracaoEfetivaMinutos(duracaoServico, slotMinutes);
        const { start: inicio, end: fim } = getIntervaloAgendamento(dataHoraFinal, duracaoMinutos);
        const existentes = await fetchAgendamentosDoDiaComServico(dataHoraFinal);
        const conflito = encontrarConflitoDeHorario({ inicio, fim, candidatoId: id, existentes, slotDurationMinutes: slotMinutes });

        if (conflito) {
          throw new Error(mensagemConflitoHorario(conflito));
        }
      }

      const { servico, ...updatePayload } = data;

      const { data: result, error } = await ((supabase
        .from('agendamentos' as any)
        .update(updatePayload as any)
        .eq('id', id)
        .select('*')
        .single()) as any);

      if (error) throw error;

      if (data.status === 'confirmado' && result) {
        const agendamento = result as Agendamento;
        const dataSemAviso = addDays(new Date(agendamento.data_hora), -1);

        await (supabase
          .from('lembretes')
          .insert([{
            agendamento_id: id,
            cliente_nome: agendamento.cliente_nome,
            mensagem: `Confirmação de agendamento para ${format(new Date(agendamento.data_hora), 'dd/MM/yyyy HH:mm')}`,
            data_envio: dataSemAviso.toISOString(),
            status: 'pendente'
          }] as any)
          .select()
          .single() as any);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lembretes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useDeleteAgendamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};
