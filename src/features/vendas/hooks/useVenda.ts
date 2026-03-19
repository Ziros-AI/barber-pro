import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/api/supabaseClient';

export type FormaPagamento = 'Dinheiro' | 'PIX' | 'Cartão Débito' | 'Cartão Crédito';

interface CreateVendaData {
  valor_servico: number;
  valor_total: number;
  forma_pagamento: FormaPagamento;
  produtos_vendidos?: Array<{
    nome: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
  }>;
  cliente_id?: string | null;
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
      if (data.valor_servico <= 0 && data.valor_total <= 0) {
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
          produtos_vendidos: data.produtos_vendidos || [],
        }] as any)
        .select()
        .single() as any);

      if (error) throw error;
      return result as Venda;
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
