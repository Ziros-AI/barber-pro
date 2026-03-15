import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabaseClient';
import { isValidPhone } from '../lib/utils';

interface CreateClienteData {
  nome: string;
  email: string;
  telefone: string;
  frequencia_dias?: number;
}

interface Cliente extends CreateClienteData {
  id: string;
  created_at: string;
}

export const useCreateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClienteData) => {
      if (!data.nome) {
        throw new Error('Nome é obrigatório');
      }

      if (!data.telefone) {
        throw new Error('Telefone é obrigatório');
      }

      if (!isValidPhone(data.telefone)) {
        throw new Error('Telefone inválido. Informe um número com DDD.');
      }

      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error('Email inválido');
      }

      const { data: result, error } = await (supabase
        .from('clientes')
        .insert([{
          ...data,
          frequencia_dias: data.frequencia_dias || 30,
        }] as any)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateClienteData>;
    }) => {
      const { data: result, error } = await (supabase
        .from('clientes' as any)
        .update(data as any as never)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
