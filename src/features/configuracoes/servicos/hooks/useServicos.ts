import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../services/api/supabaseClient'; 

interface CreateServicoDTO {
  nome: string;
  preco: number;
  duracao: number;
}

interface UpdateServicoDTO {
  id: string;
  data: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

export const useCreateServico = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServicoDTO) => {
      const { error } = await supabase
        .from('servicos')
        .insert({
          nome: data.nome,
          preco: data.preco,
          duracao: data.duracao,
        });

      if (error) {
        throw new Error(error.message);
      }
    },

    onSuccess: () => {
      // invalida lista de serviços (se você criar depois)
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
    },
  });
};

export const useUpdateServico = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateServicoDTO) => {
      const { error } = await supabase
        .from('servicos')
        .update(data)
        .eq('id', id);

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
    },
  });
};

export const useDeleteServico = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('servicos').delete().eq('id', id);

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
    },
  });
};