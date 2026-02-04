import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabaseClient';

interface CreateVendaData {
  valor_servico: number;
  valor_total: number;
  produtos_vendidos?: Array<{
    nome: string;
    quantidade: number;
    preco: number;
    subtotal: number;
  }>;
  cliente_id?: string;
  data_hora?: string;
}

interface Venda extends CreateVendaData {
  id: string;
  created_at: string;
}

export const useCreateVenda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVendaData) => {
      // Validar valores
      if (!data.valor_servico && !data.valor_total) {
        throw new Error('Valor da venda deve ser maior que 0');
      }

      if (data.valor_total < data.valor_servico) {
        throw new Error('Valor total deve ser maior ou igual ao valor do serviço');
      }

      const { data: result, error } = await (supabase
        .from('vendas')
        .insert([{
          ...data,
          data_hora: new Date().toISOString(),
          produtos_vendidos: data.produtos_vendidos || []
        }] as any)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteVenda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
