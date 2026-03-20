import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { useCreateAgendamento, useUpdateAgendamento } from '../hooks/useAgendamento';
import { ClienteAutocompleteFields } from '../../../components/shared/ClienteAutocompleteFields';
import { DateTimeField } from '../../../components/shared/DateTimeField';
import { FormNotice } from '../../../components/shared/FormNotice';
import { getHorarioAgendamentoMensagem, isHorarioAgendamentoValido } from '../utils/agendamento';
import type { Agendamento } from '../../../types';

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
  const [servico, setServico] = useState('');
  const [dataHora, setDataHora] = useState<Date>(() => getInitialDateTime(selectedDate, selectedHora));
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);

  const { mutate: criarAgendamento, isPending: isCreating } = useCreateAgendamento();
  const { mutate: atualizarAgendamento, isPending: isUpdating } = useUpdateAgendamento();
  const isEditing = Boolean(agendamento);
  const isPending = isCreating || isUpdating;
  const horarioValido = isHorarioAgendamentoValido(dataHora);

  const servicos = ['Corte', 'Barba', 'Corte + Barba', 'Pigmentação', 'Design de Barba'];

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (agendamento) {
      setClienteNome(agendamento.cliente_nome);
      setClienteTelefone(agendamento.cliente_telefone);
      setClienteValido(true);
      setServico(agendamento.servico);
      setDataHora(new Date(agendamento.data_hora));
      setFeedback(null);
      return;
    }

    setClienteNome('');
    setClienteTelefone('');
    setClienteValido(false);
    setServico('');
    setDataHora(getInitialDateTime(selectedDate, selectedHora));
    setFeedback(null);
  }, [visible, selectedDate, selectedHora, agendamento]);

  const handleCriar = () => {
    setFeedback(null);

    if (!clienteNome || !clienteTelefone || !servico) {
      setFeedback({
        title: 'Campos incompletos',
        message: 'Preencha cliente, telefone e serviço antes de continuar.',
      });
      return;
    }

    if (!clienteValido) {
      setFeedback({
        title: 'Cliente não encontrado',
        message: 'Selecione um cliente já cadastrado para salvar o agendamento.',
      });
      return;
    }

    if (!horarioValido) {
      setFeedback({
        title: 'Horário inválido',
        message: getHorarioAgendamentoMensagem(),
      });
      return;
    }

    const payload = {
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
      servico,
      data_hora: dataHora.toISOString(),
    };

    if (agendamento) {
      atualizarAgendamento(
        {
          id: agendamento.id,
          data: payload,
        },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (error) => {
            console.error('Erro ao atualizar agendamento:', error);
            setFeedback({
              title: 'Não foi possível salvar',
              message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
            });
          },
        }
      );
      return;
    }

    criarAgendamento(payload, {
      onSuccess: () => {
        setClienteNome('');
        setClienteTelefone('');
        setClienteValido(false);
        setServico('');
        setFeedback(null);
        onClose();
      },
      onError: (error) => {
        console.error('Erro ao criar agendamento:', error);
        setFeedback({
          title: 'Não foi possível criar',
          message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        });
      },
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
              <View style={styles.servicos}>
                {servicos.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setServico(item)}
                    style={[styles.servicoButton, servico === item && styles.servicoButtonActive]}
                  >
                    <Text style={[styles.servicoText, servico === item && styles.servicoTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                message={getHorarioAgendamentoMensagem()}
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
                (!clienteValido || isPending || !horarioValido) && styles.buttonPrimaryDisabled,
              ]}
              onPress={handleCriar}
              disabled={isPending || !clienteValido || !horarioValido}
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
  servicoButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    color: COLORS.zinc400,
    fontWeight: '600',
    textAlign: 'center',
  },
  servicoTextActive: {
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
