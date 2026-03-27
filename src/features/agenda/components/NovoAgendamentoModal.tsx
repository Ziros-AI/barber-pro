import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { endOfDay, format, startOfDay } from 'date-fns';
import { COLORS } from '../../../styles/colors';
import { useCreateAgendamento, useUpdateAgendamento } from '../hooks/useAgendamento';
import { ClienteAutocompleteFields } from '../../../components/shared/ClienteAutocompleteFields';
import { DateTimeField } from '../../../components/shared/DateTimeField';
import { FormNotice } from '../../../components/shared/FormNotice';
import { supabase } from '../../../services/api/supabaseClient';
import { getHorarioAgendamentoMensagem, isHorarioAgendamentoValido } from '../utils/agendamento';
import type { Agendamento } from '../../../types';
import { useAgendaConfig } from '../hooks/useAgendaConfig';
import { DEFAULT_AGENDA_CONFIG, normalizeAgendaConfig } from '../utils/agendaConfig';
import { encontrarConflitoDeHorario, getDuracaoEfetivaMinutos, getIntervaloAgendamento, mensagemConflitoHorario } from '../utils/agendaConflitos';

interface NovoAgendamentoModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedHora?: string | null;
  agendamento?: Agendamento | null;
}

const getInitialDateTime = (selectedDate?: Date, selectedHora?: string | null) => {
  if (selectedDate && selectedHora) {
    const [horas, minutos] = selectedHora.split(':').map(Number);
    const novaData = new Date(selectedDate);
    novaData.setHours(horas || 0, minutos || 0, 0, 0);
    return novaData;
  }

  return new Date();
};

export const NovoAgendamentoModal: React.FC<NovoAgendamentoModalProps> = ({
  visible,
  onClose,
  selectedDate,
  selectedHora,
  agendamento,
}) => {
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteValido, setClienteValido] = useState(false);
  const [servicoId, setServicoId] = useState('');
  const [dataHora, setDataHora] = useState<Date>(() => getInitialDateTime(selectedDate, selectedHora));
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);
  const { data: agendaConfig } = useAgendaConfig();

  const { mutate: criarAgendamento, isPending: isCreating } = useCreateAgendamento(agendaConfig);
  const { mutate: atualizarAgendamento, isPending: isUpdating } = useUpdateAgendamento(agendaConfig);
  const isEditing = Boolean(agendamento);
  const isPending = isCreating || isUpdating;
  const horarioValido = isHorarioAgendamentoValido(dataHora, agendaConfig);
  const agendaNormalizada = agendaConfig ? normalizeAgendaConfig(agendaConfig) : null;
  const slotMinutes = agendaNormalizada?.slotDurationMinutes ?? DEFAULT_AGENDA_CONFIG.slotDurationMinutes;

  const diaChaveModal = format(startOfDay(dataHora), 'yyyy-MM-dd');

  const { data: servicos = [], isLoading: isLoadingServicos } = useQuery({
    queryKey: ['servicos'],
    enabled: visible,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, preco, duracao')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const { data: agendamentosDia = [] } = useQuery({
    queryKey: ['agendamentos', 'modal-conflito', diaChaveModal],
    enabled: visible,
    queryFn: async () => {
      const inicio = startOfDay(dataHora).toISOString();
      const fim = endOfDay(dataHora).toISOString();
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, data_hora, servico_id, status, cliente_nome, servicos(duracao)')
        .gte('data_hora', inicio)
        .lte('data_hora', fim)
        .order('data_hora', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as unknown as Agendamento[];
    }
  });

  const conflitoHorario = useMemo(() => {
    if (!visible || !servicoId || !agendaNormalizada) {
      return null;
    }

    const duracaoServ = servicos.find((item) => item.id === servicoId)?.duracao;
    const duracaoMinutos = getDuracaoEfetivaMinutos(
      duracaoServ != null ? Number(duracaoServ) : undefined,
      slotMinutes
    );
    const { start: inicio, end: fim } = getIntervaloAgendamento(dataHora, duracaoMinutos);

    return encontrarConflitoDeHorario({ inicio, fim, candidatoId: agendamento?.id, existentes: agendamentosDia, slotDurationMinutes: slotMinutes });
  }, [visible, servicoId, agendaNormalizada, dataHora, servicos, agendamento?.id, agendamentosDia, slotMinutes]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (agendamento) {
      setClienteNome(agendamento.cliente_nome);
      setClienteTelefone(agendamento.cliente_telefone);
      setClienteValido(true);
      setServicoId(agendamento.servico_id || agendamento.servicos?.id || '');
      setDataHora(new Date(agendamento.data_hora));
      setFeedback(null);
      return;
    }

    setClienteNome('');
    setClienteTelefone('');
    setClienteValido(false);
    setServicoId('');
    setDataHora(getInitialDateTime(selectedDate, selectedHora));
    setFeedback(null);
  }, [visible, selectedDate, selectedHora, agendamento]);

  const handleCriar = () => {
    setFeedback(null);
    const servicoSelecionado = servicos.find((item) => item.id === servicoId);

    if (!clienteNome || !clienteTelefone || !servicoId) {
      setFeedback({
        title: 'Campos incompletos',
        message: 'Preencha cliente, telefone e serviço antes de continuar.'
      });
      return;
    }

    if (!clienteValido) {
      setFeedback({
        title: 'Cliente não encontrado',
        message: 'Selecione um cliente já cadastrado para salvar o agendamento.'
      });
      return;
    }

    if (!horarioValido) {
      setFeedback({
        title: 'Horário inválido',
        message: getHorarioAgendamentoMensagem(agendaConfig, dataHora)
      });
      return;
    }

    if (conflitoHorario) {
      setFeedback({
        title: 'Horário indisponível',
        message: mensagemConflitoHorario(conflitoHorario)
      });
      return;
    }

    const payload = {
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
      servico_id: servicoId,
      data_hora: dataHora.toISOString()
    };

    if (agendamento) {
      atualizarAgendamento(
        { id: agendamento.id, data: payload },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (error) => {
            console.error('Erro ao atualizar agendamento:', error);
            setFeedback({
              title: 'Não foi possível salvar',
              message: error instanceof Error ? error.message : 'Tente novamente em instantes.'
            });
          }
        }
      );
      return;
    }

    criarAgendamento(payload, {
      onSuccess: () => {
        setClienteNome('');
        setClienteTelefone('');
        setClienteValido(false);
        setServicoId('');
        setFeedback(null);
        onClose();
      },
      onError: (error) => {
        console.error('Erro ao criar agendamento:', error);
        setFeedback({
          title: 'Não foi possível criar',
          message: error instanceof Error ? error.message : 'Tente novamente em instantes.'
        });
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.white} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {feedback && <FormNotice type="error" title={feedback.title} message={feedback.message} />}

            {conflitoHorario && !feedback && (
              <FormNotice
                type="error"
                title="Horário indisponível"
                message={mensagemConflitoHorario(conflitoHorario)}
              />
            )}

            <ClienteAutocompleteFields
              visible={visible}
              clienteNome={clienteNome}
              clienteTelefone={clienteTelefone}
              setClienteNome={setClienteNome}
              setClienteTelefone={setClienteTelefone}
              onClienteValidoChange={setClienteValido}
              inputBackgroundColor={COLORS.background}
              inputGroupStyle={styles.inputGroup}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Serviço</Text>
              {isLoadingServicos ? (
                <View style={styles.servicosLoading}>
                  <ActivityIndicator size="small" color={COLORS.gold} />
                </View>
              ) : servicos.length > 0 ? (
                <View style={styles.servicos}>
                  {servicos.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setServicoId(item.id)}
                      style={[styles.servicoButton, servicoId === item.id && styles.servicoButtonActive]}
                    >
                      <Text style={[styles.servicoText, servicoId === item.id && styles.servicoTextActive]}>
                        {item.nome}
                      </Text>
                      <Text
                        style={[
                          styles.servicoMetaText,
                          servicoId === item.id && styles.servicoMetaTextActive
                        ]}
                      >
                        R$ {Number(item.preco).toFixed(2)} • {item.duracao} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <FormNotice
                  type="info"
                  title="Nenhum serviço cadastrado"
                  message="Cadastre pelo menos um serviço na tela de Serviços antes de criar o agendamento."
                />
              )}
            </View>

            <DateTimeField
              value={dataHora}
              onChange={setDataHora}
              inputBackgroundColor={COLORS.background}
              containerStyle={styles.inputGroup}
              labelStyle={styles.label}
              inputStyle={styles.input}
              inputTextStyle={styles.inputText}
              pickerCardStyle={styles.pickerCard}
              pickerLabelStyle={styles.pickerLabel}
            />

            {!horarioValido && (
              <FormNotice
                type="info"
                title="Horário de atendimento"
                message={getHorarioAgendamentoMensagem(agendaConfig, dataHora)}
              />
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                (!clienteValido || isPending || !horarioValido || !servicoId || isLoadingServicos || Boolean(conflitoHorario)) && styles.buttonPrimaryDisabled
              ]}
              onPress={handleCriar}
              disabled={isPending || !clienteValido || !horarioValido || !servicoId || isLoadingServicos || Boolean(conflitoHorario)}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.buttonTextPrimary}>{isEditing ? 'Salvar' : 'Criar'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  inputText: {
    color: COLORS.white,
  },
  pickerCard: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  pickerLabel: {
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: 8,
  },
  servicos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicosLoading: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicoButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    flex: 1,
    minWidth: '48%',
  },
  servicoButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  servicoText: {
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  servicoTextActive: {
    color: COLORS.background,
  },
  servicoMetaText: {
    color: COLORS.zinc500,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  servicoMetaTextActive: {
    color: COLORS.background,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  buttonPrimary: {
    backgroundColor: COLORS.gold,
  },
  buttonPrimaryDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: COLORS.background,
    fontWeight: '700',
  },
});
