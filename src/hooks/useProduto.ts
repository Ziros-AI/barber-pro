import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';

interface CreateProdutoData {
  nome: string;
  marca: string;
  preco: number;
  estoque?: number;
}

interface Produto extends CreateProdutoData {
  id: string;
  created_at: string;
}

export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProdutoData) => {
      // Validar campos obrigatórios
      if (!data.nome) {
        throw new Error('Nome é obrigatório');
      }

      if (!data.preco || data.preco <= 0) {
        throw new Error('Preço deve ser maior que 0');
      }

      const { data: result, error } = await (supabase
        .from('produtos')
        .insert([{
          ...data,
          estoque: data.estoque || 0
        }] as any)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string;
      data: Partial<CreateProdutoData>;
    }) => {
      // Validar preço se estiver sendo atualizado
      if (data.preco !== undefined && data.preco <= 0) {
        throw new Error('Preço deve ser maior que 0');
      }

      const { data: result, error } = await (supabase
        .from('produtos' as any)
        .update(data as any as never)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
