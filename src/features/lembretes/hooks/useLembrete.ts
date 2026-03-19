import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/api/supabaseClient';

interface CreateLembreteData {
  cliente_nome: string;
  cliente_telefone: string;
  servico: string;
  data_envio: string;
  mensagem: string;
  status: string;
  agendamento_id?: string;
}

interface UpdateLembreteData {
  status?: string;
  mensagem?: string;
  data_envio?: string;
}

export const useCreateLembrete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLembreteData) => {
      const { data: result, error } = await (supabase
        .from('lembretes' as any)
        .insert([data] as any as never)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembretes'] });
    },
  });
};

export const useUpdateLembrete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLembreteData }) => {
      const { data: result, error } = await (supabase
        .from('lembretes' as any)
        .update(data as any as never)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembretes'] });
    },
  });
};

export const useDeleteLembrete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('lembretes' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembretes'] });
    },
  });
};
