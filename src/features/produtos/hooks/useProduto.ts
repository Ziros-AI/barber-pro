import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/api/supabaseClient';
import { useAuth } from '../../../app/providers/AuthProvider';

export interface CreateProdutoData {
  nome: string;
  marca: string;
  preco: number;
  estoque?: number;
  estoque_minimo?: number;
  preco_custo?: number;
}

interface Produto extends CreateProdutoData {
  id: string;
  created_at: string;
}

export const useCreateProduto = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateProdutoData) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (!data.nome) {
        throw new Error('Nome é obrigatório');
      }

      if (!data.preco || data.preco <= 0) {
        throw new Error('Preço deve ser maior que 0');
      }

      if ((data.preco_custo || 0) < 0) {
        throw new Error('Preço de custo não pode ser negativo');
      }

      if ((data.estoque_minimo || 0) < 0) {
        throw new Error('Estoque mínimo não pode ser negativo');
      }

      const { data: result, error } = await (supabase
        .from('produtos')
        .insert([
          {
            ...data,
            user_id: user.id,
            estoque: data.estoque || 0,
            estoque_minimo: data.estoque_minimo || 0,
            preco_custo: data.preco_custo || 0,
          },
        ] as any)
        .select()
        .single() as any);

      if (error) throw error;
      return result as Produto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-dashboard', user?.id] });
    },
  });
};

export const useUpdateProduto = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateProdutoData>;
    }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (data.preco !== undefined && data.preco <= 0) {
        throw new Error('Preço deve ser maior que 0');
      }

      if (data.preco_custo !== undefined && data.preco_custo < 0) {
        throw new Error('Preço de custo não pode ser negativo');
      }

      if (data.estoque_minimo !== undefined && data.estoque_minimo < 0) {
        throw new Error('Estoque mínimo não pode ser negativo');
      }

      const { data: result, error } = await (supabase
        .from('produtos' as any)
        .update(data as any as never)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single() as any);

      if (error) throw error;
      return result as Produto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-dashboard', user?.id] });
    },
  });
};

export const useDeleteProduto = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-dashboard', user?.id] });
    },
  });
};
