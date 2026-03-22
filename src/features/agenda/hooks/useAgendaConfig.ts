import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/api/supabaseClient';
import { useAuth } from '../../../app/providers/AuthProvider';
import { DEFAULT_AGENDA_CONFIG, normalizeAgendaConfig, type AgendaConfig } from '../utils/agendaConfig';

export const fetchAgendaConfigByUserId = async (userId: string): Promise<AgendaConfig & { id?: string }> => {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    throw error;
  }

  const firstConfig = data?.[0];

  return {
    id: firstConfig?.id,
    ...normalizeAgendaConfig({
      slotDurationMinutes: (firstConfig as any)?.agenda_intervalo_minutos,
      weekSchedule: (firstConfig as any)?.agenda_semana,
    }),
  };
};

export const useAgendaConfig = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['configuracoes', 'agenda', user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchAgendaConfigByUserId(user!.id),
  });
};
