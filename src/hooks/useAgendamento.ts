import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { supabase } from '../api/supabaseClient';
import { getHorarioAgendamentoMensagem, isHorarioAgendamentoValido } from '../utils/agendamento';

interface CreateAgendamentoData {
  data_hora: string;
  cliente_nome: string;
  cliente_telefone: string;
  servico: string;
  status?: string;
  confirmado_whatsapp?: boolean;
}

interface Agendamento extends CreateAgendamentoData {
  id: string;
  created_at: string;
}

interface Lembrete {
  agendamento_id: string;
  cliente_nome: string;
  mensagem: string;
  data_envio: string;
  status: string;
}

export const useCreateAgendamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgendamentoData) => {
      if (!isHorarioAgendamentoValido(data.data_hora)) {
        throw new Error(getHorarioAgendamentoMensagem());
      }

      const { data: result, error } = await (supabase
        .from('agendamentos')
        .insert([{
          ...data,
          status: data.status || 'pendente',
          confirmado_whatsapp: false,
        }] as any)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateAgendamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateAgendamentoData>;
    }) => {
      if (data.data_hora && !isHorarioAgendamentoValido(data.data_hora)) {
        throw new Error(getHorarioAgendamentoMensagem());
      }

      const { data: result, error } = await (supabase
        .from('agendamentos' as any)
        .update(data as any as never)
        .eq('id', id)
        .select()
        .single() as any);

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
            status: 'pendente',
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
    },
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
    },
  });
};
