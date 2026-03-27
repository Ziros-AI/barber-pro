import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, endOfDay, format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, CheckCircle2, Clock, MessageCircle, Plus, Settings, Trash2, XCircle } from 'lucide-react-native';
import { supabase } from '../../../services/api/supabaseClient';
import { COLORS } from '../../../styles/colors';
import { useAlert } from '../../../app/providers/AlertProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { Agendamento } from '../../../types';
import { NovoAgendamentoModal } from '../components/NovoAgendamentoModal';
import { AgendaConfigModal } from '../components/AgendaConfigModal';
import { useDeleteAgendamento } from '../hooks/useAgendamento';
import { useAgendaConfig } from '../hooks/useAgendaConfig';
import {
  DAY_LABELS,
  DEFAULT_AGENDA_CONFIG,
  getAgendaDayConfig,
  getTimeSlotsForDate,
  normalizeAgendaConfig,
  type AgendaConfig,
} from '../utils/agendaConfig';
import { applyReminderTemplate, parseLembretesAtivos } from '../utils/reminderTemplate';

const DEFAULT_LEMBRETE_TEMPLATE =
  'Olá {nome}, lembrete do seu {servico} amanhã às {hora}. Te esperamos! - {barbearia}';

const DEFAULT_CONFIG_INSERT = {
  nome_barbearia: 'Barbearia',
  mensagem_lembrete_template: DEFAULT_LEMBRETE_TEMPLATE,
};

const getMutationErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return (
      maybeError.message ||
      maybeError.details ||
      maybeError.hint ||
      maybeError.code ||
      JSON.stringify(error)
    );
  }

  return 'erro desconhecido';
};

const addMinutesToTime = (time: string, minutesToAdd: number) => {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const nextHours = Math.floor(normalized / 60);
  const nextMinutes = normalized % 60;

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
};

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedHora, setSelectedHora] = useState<string | null>(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();
  const { user } = useAuth();
  const { mutate: excluirAgendamento } = useDeleteAgendamento();
  const {
    data: agendaConfigData,
    isLoading: isLoadingAgendaConfig,
    error: agendaConfigError,
    isError: hasAgendaConfigError,
  } = useAgendaConfig();
  const agendaConfig = normalizeAgendaConfig(agendaConfigData || DEFAULT_AGENDA_CONFIG);

  useEffect(() => {
    if (!hasAgendaConfigError) {
      return;
    }

    showAlert(
      'Aviso',
      `Não foi possível carregar a configuração da agenda. Usando padrão temporário. ${getMutationErrorMessage(agendaConfigError)}`,
      'warning'
    );
  }, [agendaConfigError, hasAgendaConfigError, showAlert]);

  const { data: servicos = [] } = useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, preco, duracao');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });

  const saveAgendaConfig = useMutation({
    mutationFn: async (config: AgendaConfig) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado.');
      }

      const payload = {
        user_id: user.id,
        agenda_intervalo_minutos: config.slotDurationMinutes,
        agenda_semana: config.weekSchedule,
      };

      const { data: existingConfigs, error: existingConfigError } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingConfigError) {
        throw existingConfigError;
      }

      const existingConfigId = existingConfigs?.[0]?.id || agendaConfigData?.id;

      if (existingConfigId) {
        const { error } = await (supabase
          .from('configuracoes' as any)
          .update(payload as any)
          .eq('id', existingConfigId)
          .eq('user_id', user.id) as any);

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await (supabase
        .from('configuracoes' as any)
        .insert([{ ...DEFAULT_CONFIG_INSERT, ...payload }] as any) as any);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'agenda', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setConfigModalVisible(false);
      showAlert('Sucesso', 'Escala da agenda salva com sucesso.', 'success');
    },
    onError: (error) => {
      console.error('Erro ao salvar escala da agenda:', error);
      showAlert(
        'Erro',
        `Não foi possível salvar a escala: ${getMutationErrorMessage(error)}`,
        'error'
      );
    },
  });

  const servicosMap = useMemo(
    () => new Map(servicos.map((servico) => [servico.id, servico])),
    [servicos]
  );

  const getNomeServico = (agendamento: Agendamento) =>
    servicosMap.get(agendamento.servico_id || '')?.nome ||
    agendamento.servicos?.nome ||
    agendamento.servico ||
    'Servico nao informado';

  const getDuracaoServico = (agendamento: Agendamento) =>
    Number(
      servicosMap.get(agendamento.servico_id || '')?.duracao ||
      agendamento.servicos?.duracao ||
      agendaConfig.slotDurationMinutes
    );

  const queryConfiguracoes = useQuery({
    queryKey: ['configuracoes', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      return data?.[0] || null;
    },
  });
  const { data: agendamentoData = [] } = useQuery<Agendamento[], Error>({
    queryKey: ['agendamentos', selectedDate],
    queryFn: async () => {
      const startOfDayDate = startOfDay(selectedDate).toISOString();
      const endOfDayDate = endOfDay(selectedDate).toISOString();

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data_hora', startOfDayDate)
        .lte('data_hora', endOfDayDate)
        .order('data_hora', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as Agendamento[];
    },
  });
  const agendamentos = agendamentoData;


  const confirmarWhatsApp = async (agendamento: any) => {
    try {
      if (!user?.id) {
        return;
      }

      const { data: configRows, error: configError } = await supabase
        .from('configuracoes')
        .select('nome_barbearia, mensagem_lembrete_template, lembretes_ativos, horas_lembrete')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (configError) {
        console.error('Erro ao carregar configurações (WhatsApp):', configError);
      }

      const row = (configRows?.[0] ?? {}) as {
        nome_barbearia?: string | null;
        mensagem_lembrete_template?: string | null;
        lembretes_ativos?: boolean | null;
        horas_lembrete?: number | null;
      };

      const nomeBarbearia =
        String(row.nome_barbearia ?? '').trim() || DEFAULT_CONFIG_INSERT.nome_barbearia;
      const templateSalvo = String(row.mensagem_lembrete_template ?? '').trim();
      const lembretesAtivosConfirm = parseLembretesAtivos(row.lembretes_ativos);
      const horasLembreteConfirm = Number(row.horas_lembrete) > 0 ? Number(row.horas_lembrete) : 24;

      const dataAgendamento = parseISO(agendamento.data_hora);
      const servicoNome = getNomeServico(agendamento);
      const horaFormatada = format(dataAgendamento, 'HH:mm');

      const vars = {
        nome: agendamento.cliente_nome,
        servico: servicoNome,
        hora: horaFormatada,
        barbearia: nomeBarbearia,
      };

      const textoConfirmacaoWhatsApp = `Fala ${agendamento.cliente_nome}! Confirmado seu ${servicoNome.toLowerCase()} às ${horaFormatada}! ✂️`;

      let mensagemWhatsApp: string;
      let mensagemLembrete: string;
      let dataLembrete: Date;

      if (lembretesAtivosConfirm) {
        const templateBase = templateSalvo || DEFAULT_LEMBRETE_TEMPLATE;
        const preenchido = applyReminderTemplate(templateBase, vars);
        mensagemWhatsApp = preenchido;
        mensagemLembrete = preenchido;
        dataLembrete = new Date(dataAgendamento.getTime() - horasLembreteConfirm * 60 * 60 * 1000);
      } else {
        mensagemWhatsApp = textoConfirmacaoWhatsApp;
        mensagemLembrete = `Confirmação de agendamento para ${format(dataAgendamento, 'dd/MM/yyyy HH:mm')}`;
        dataLembrete = addDays(dataAgendamento, -1);
      }

      const msg = encodeURIComponent(mensagemWhatsApp);
      const phone = agendamento.cliente_telefone?.replace(/\D/g, '');

      if (phone) {
        Linking.openURL(`https://wa.me/55${phone}?text=${msg}`);
      }

      // ✅ atualiza agendamento
      await supabase
        .from('agendamentos')
        .update({
          confirmado_whatsapp: true,
          status: 'confirmado'
        })
        .eq('id', agendamento.id);

      // (opcional, mas bom) remove lembrete antigo
      await supabase
        .from('lembretes')
        .delete()
        .eq('agendamento_id', agendamento.id);

      // ✅ cria lembrete
      await supabase
        .from('lembretes')
        .insert({
          agendamento_id: agendamento.id,
          cliente_nome: agendamento.cliente_nome,
          mensagem: mensagemLembrete,
          data_envio: dataLembrete.toISOString(),
          status: 'pendente',
        });

      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lembretes'] });

    } catch (error) {
      console.error('Erro ao confirmar:', error);
    }
  };

  const horariosDoDia = useMemo(
    () => getTimeSlotsForDate(agendaConfig, selectedDate),
    [agendaConfig, selectedDate]
  );

  const dayConfig = useMemo(
    () => getAgendaDayConfig(agendaConfig, selectedDate),
    [agendaConfig, selectedDate]
  );

  const agendamentosForaDaEscala = useMemo(
    () =>
      agendamentos.filter((agendamento) => {
        const hora = format(parseISO(agendamento.data_hora), 'HH:mm');
        return !horariosDoDia.includes(hora);
      }),
    [agendamentos, horariosDoDia]
  );

  const ocupacaoPorHorario = useMemo(() => {
    const ocupacao: Record<
      string,
      Array<{
        agendamento: Agendamento;
        isStart: boolean;
        span: number;
        duration: number;
      }>
    > = {};

    agendamentos.forEach((agendamento) => {
      const horaInicial = format(parseISO(agendamento.data_hora), 'HH:mm');
      const indiceInicial = horariosDoDia.indexOf(horaInicial);

      if (indiceInicial === -1) {
        return;
      }

      const duration = Math.max(agendaConfig.slotDurationMinutes, getDuracaoServico(agendamento));
      const span = Math.max(1, Math.ceil(duration / agendaConfig.slotDurationMinutes));

      for (let offset = 0; offset < span; offset += 1) {
        const hora = horariosDoDia[indiceInicial + offset];

        if (!hora) {
          break;
        }

        if (!ocupacao[hora]) {
          ocupacao[hora] = [];
        }

        ocupacao[hora].push({
          agendamento,
          isStart: offset === 0,
          span,
          duration,
        });
      }
    });

    return ocupacao;
  }, [agendaConfig.slotDurationMinutes, agendamentos, getDuracaoServico, horariosDoDia]);

  const slotsRenderizados = useMemo(() => {
    const items: Array<
      | { type: 'agendamento'; hora: string; agendamento: Agendamento; duration: number; span: number; endTime: string }
      | { type: 'disponivel'; hora: string }
    > = [];

    for (let index = 0; index < horariosDoDia.length; index += 1) {
      const hora = horariosDoDia[index];
      const ocupacoesNoHorario = ocupacaoPorHorario[hora] || [];
      const agendamentosIniciando = ocupacoesNoHorario.filter((item) => item.isStart);

      if (agendamentosIniciando.length > 0) {
        agendamentosIniciando.forEach(({ agendamento, duration, span }) => {
          items.push({
            type: 'agendamento',
            hora,
            agendamento,
            duration,
            span,
            endTime: addMinutesToTime(hora, duration),
          });
        });

        const maiorSpan = Math.max(...agendamentosIniciando.map((item) => item.span));
        index += maiorSpan - 1;
        continue;
      }

      items.push({ type: 'disponivel', hora });
    }

    return items;
  }, [horariosDoDia, ocupacaoPorHorario]);

  const proximosDias = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(new Date(), index)),
    []
  );

  const abrirNovoAgendamento = (hora?: string | null) => {
    setSelectedAgendamento(null);
    setSelectedHora(hora || null);
    setModalVisible(true);
  };

  const abrirEdicaoAgendamento = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento);
    setSelectedHora(null);
    setModalVisible(true);
  };

  const handleExcluirAgendamento = (agendamento: Agendamento) => {
    showConfirm(
      'Excluir agendamento',
      `Deseja excluir o agendamento de ${agendamento.cliente_nome} Ã s ${format(parseISO(agendamento.data_hora), 'HH:mm')}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            excluirAgendamento(agendamento.id, {
              onError: (error) => {
                console.error('Erro ao excluir agendamento:', error);
                showAlert('Erro', 'NÃ£o foi possÃ­vel excluir o agendamento.', 'error');
              },
            });
          },
        },
      ]
    );
  };

  const renderAgendamentoCard = (
    agendamento: Agendamento,
    options?: { horaExibida?: string; duration?: number; span?: number; endTime?: string }
  ) => (
    <TouchableOpacity
      key={agendamento.id}
      style={[
        styles.agendamentoCard,
        options?.span && options.span > 1 ? { minHeight: options.span * 86 } : null,
      ]}
      activeOpacity={0.9}
      onPress={() => abrirEdicaoAgendamento(agendamento)}
    >
      <View style={styles.agendamentoHeader}>
        <View style={styles.agendamentoInfo}>
          <Text style={styles.clienteNome}>{agendamento.cliente_nome}</Text>
          <Text style={styles.servico}>{getNomeServico(agendamento)}</Text>
          <Text style={styles.duracaoText}>
            {options?.duration || getDuracaoServico(agendamento)} min
            {(options?.span || 1) > 1 ? ` • ocupa ${options?.span} slots` : ''}
          </Text>
        </View>
        <View style={styles.horaTag}>
          <Text style={styles.horaText}>
            {options?.horaExibida || format(parseISO(agendamento.data_hora), 'HH:mm')}
          </Text>
        </View>
      </View>

      <Text style={styles.intervaloText}>
        {options?.horaExibida || format(parseISO(agendamento.data_hora), 'HH:mm')}
        {options?.endTime ? ` - ${options.endTime}` : ''}
      </Text>

      <View style={styles.cardActions}>
        <View style={styles.primaryActionContainer}>
          {!agendamento.confirmado_whatsapp && (
            <TouchableOpacity onPress={() => confirmarWhatsApp(agendamento)} style={styles.whatsappButton}>
              <MessageCircle color="#fff" size={18} style={styles.whatsappIcon} />
              <Text style={styles.whatsappButtonText}>Confirmar WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => handleExcluirAgendamento(agendamento)} style={styles.deleteButton}>
          <Trash2 color="#fff" size={18} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (queryConfiguracoes.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Agenda</Text>
            <Text style={styles.subtitle}>Seus atendimentos</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.secondaryHeaderButton} onPress={() => setConfigModalVisible(true)}>
              <Settings color={COLORS.white} size={18} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.addButton} onPress={() => abrirNovoAgendamento()}>
              <Plus color={COLORS.background} size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.daysContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {proximosDias.map((dia) => {
              const isSelected = isSameDay(dia, selectedDate);

              return (
                <TouchableOpacity
                  key={dia.toISOString()}
                  onPress={() => setSelectedDate(dia)}
                  style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                    {format(dia, 'EEE', { locale: ptBR })}
                  </Text>
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                    {format(dia, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.content}>
          <View style={styles.summaryCard}>
            <View>
              <View style={styles.summaryTitleRow}>
                {dayConfig.enabled ? (
                  <CheckCircle2 color={COLORS.green} size={18} />
                ) : (
                  <XCircle color={COLORS.red} size={18} />
                )}
                <Text style={styles.summaryTitle}>{DAY_LABELS[selectedDate.getDay()]}</Text>
              </View>
              {dayConfig.enabled ? (
                <View style={styles.summaryScheduleRow}>
                  <Text style={styles.summaryText}>{dayConfig.startTime}</Text>
                  <ArrowRight color={COLORS.zinc300} size={16} />
                  <Text style={styles.summaryText}>{dayConfig.endTime}</Text>
                  <Text style={styles.summaryDivider}>|</Text>
                  <Text style={styles.summaryText}>{agendaConfig.slotDurationMinutes} min</Text>
                </View>
              ) : (
                <Text style={styles.summaryText}>Ative este dia para liberar horarios na grade.</Text>
              )}
              {dayConfig.enabled && dayConfig.pauses.length > 0 && (
                <View style={styles.summaryPausesRow}>
                  <Text style={styles.summaryPauseText}>Pausas:</Text>
                  {dayConfig.pauses.map((pause, index) => (
                    <View key={`${pause.startTime}-${pause.endTime}-${index}`} style={styles.summaryPauseItem}>
                      <Text style={styles.summaryPauseText}>{pause.startTime}</Text>
                      <ArrowRight color={COLORS.gold} size={14} />
                      <Text style={styles.summaryPauseText}>{pause.endTime}</Text>
                      {index < dayConfig.pauses.length - 1 && <Text style={styles.summaryPauseText}>|</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {agendamentosForaDaEscala.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Horarios fora da escala</Text>
              <Text style={styles.sectionSubtitle}>
                Esses agendamentos foram criados fora da grade configurada para este dia.
              </Text>

              {agendamentosForaDaEscala.map((agendamento) => (
                <View key={agendamento.id} style={styles.horarioItem}>
                  {renderAgendamentoCard(agendamento)}
                </View>
              ))}
            </View>
          )}

          {horariosDoDia.length > 0 &&
            slotsRenderizados.map((item) => (
              <View
                key={item.type === 'agendamento' ? `${item.agendamento.id}-${item.hora}` : item.hora}
                style={styles.horarioItem}
              >
                {item.type === 'agendamento' ? (
                  <View style={styles.slotCardSpacing}>
                    {renderAgendamentoCard(item.agendamento, {
                      horaExibida: item.hora,
                      duration: item.duration,
                      span: item.span,
                      endTime: item.endTime,
                    })}
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => abrirNovoAgendamento(item.hora)} style={styles.disponivelCard}>
                    <Clock color={COLORS.zinc500} size={18} style={styles.clockIcon} />
                    <Text style={styles.disponivelHora}>{item.hora}</Text>
                    <Text style={styles.disponivelText}>Clique para agendar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
        </View>
      </ScrollView>

      <NovoAgendamentoModal
        visible={modalVisible}
        selectedDate={selectedDate}
        selectedHora={selectedHora}
        agendamento={selectedAgendamento}
        onClose={() => {
          setModalVisible(false);
          setSelectedHora(null);
          setSelectedAgendamento(null);
        }}
      />

      <AgendaConfigModal
        visible={configModalVisible}
        initialConfig={agendaConfig}
        isSaving={saveAgendaConfig.isPending}
        onClose={() => setConfigModalVisible(false)}
        onSave={(config) => saveAgendaConfig.mutate(config)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.cardBg,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 16,
  },
  secondaryHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.cardBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.zinc700,
  },
  addButton: {
    backgroundColor: COLORS.gold,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  daysContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  dayButton: {
    width: 70,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.zinc700,
  },
  dayButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: COLORS.zinc400,
  },
  dayTextActive: {
    color: COLORS.background,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
    color: COLORS.zinc400,
  },
  dayNumberActive: {
    color: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  summaryText: {
    color: COLORS.zinc300,
    fontSize: 14,
  },
  summaryScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  summaryDivider: {
    color: COLORS.zinc500,
    fontSize: 14,
  },
  summaryHint: {
    marginTop: 6,
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryPausesRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryPauseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryPauseText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.zinc400,
    marginBottom: 12,
  },
  horarioItem: {
    marginBottom: 12,
  },
  slotCardSpacing: {
    marginBottom: 8,
  },
  agendamentoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  primaryActionContainer: {
    flex: 1,
  },
  agendamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agendamentoInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  servico: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  duracaoText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.gold,
    fontWeight: '600',
  },
  intervaloText: {
    marginBottom: 12,
    color: COLORS.zinc300,
    fontSize: 13,
    fontWeight: '600',
  },
  horaTag: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  horaText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 14,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
  },
  whatsappIcon: {
    marginRight: 8,
  },
  whatsappButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    height: 44,
    width: 44,
    borderRadius: 8,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  disponivelCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.zinc700,
  },
  clockIcon: {
    marginRight: 8,
  },
  disponivelHora: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.zinc400,
    marginRight: 12,
  },
  disponivelText: {
    fontSize: 14,
    color: COLORS.zinc500,
  },
});
