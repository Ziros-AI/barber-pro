import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/api/supabaseClient';
import { isValidPhone, mapClienteError, normalizeEmail } from '../../../lib/utils';

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

type ClientePayload = Omit<CreateClienteData, 'email'> & {
  email: string | null;
};

const validateClienteData = (data: Partial<CreateClienteData>) => {
  const payload: Partial<ClientePayload> = { ...data };

  if (typeof payload.nome === 'string') {
    payload.nome = payload.nome.trim();

    if (!payload.nome) {
      throw new Error('Nome e obrigatorio');
    }
  }

  if (typeof payload.telefone === 'string') {
    payload.telefone = payload.telefone.replace(/\D/g, '');

    if (!payload.telefone) {
      throw new Error('Telefone e obrigatorio');
    }

    if (!isValidPhone(payload.telefone)) {
      throw new Error('Telefone invalido. Informe um numero com DDD.');
    }
  }

  if (typeof payload.email === 'string') {
    const normalizedEmail = normalizeEmail(payload.email);
    payload.email = normalizedEmail.length > 0 ? normalizedEmail : null;

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      throw new Error('Email invalido');
    }
  }

  return payload;
};

export const useCreateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClienteData) => {
      const payload = validateClienteData(data) as ClientePayload;

      if (!payload.nome) {
        throw new Error('Nome e obrigatorio');
      }

      if (!payload.telefone) {
        throw new Error('Telefone e obrigatorio');
      }

      const { data: result, error } = await (supabase
        .from('clientes')
        .insert([{
          ...payload,
          frequencia_dias: payload.frequencia_dias || 30,
        }] as any)
        .select()
        .single() as any);

      if (error) throw mapClienteError(error);
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
      const payload = validateClienteData(data);

      const { data: result, error } = await (supabase
        .from('clientes' as any)
        .update(payload as any as never)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw mapClienteError(error);
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
