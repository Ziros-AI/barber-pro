import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../services/api/supabaseClient'; 

interface CreateServicoDTO {
  nome: string;
  preco: number;
  duracao: number;
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