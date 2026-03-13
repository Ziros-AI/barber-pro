import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';
import { useCreateAgendamento } from '../../hooks/useAgendamento';
import { ClienteAutocompleteFields } from '../shared/ClienteAutocompleteFields';
import { DateTimeField } from '../shared/DateTimeField';

interface NovoAgendamentoModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedHora?: string | null;
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

export const NovoAgendamentoModal: React.FC<NovoAgendamentoModalProps> = ({ visible, onClose, selectedDate, selectedHora }) => {
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [servico, setServico] = useState('');
  const [dataHora, setDataHora] = useState<Date>(() => getInitialDateTime(selectedDate, selectedHora));

  const { mutate: criarAgendamento, isPending } = useCreateAgendamento();

  const servicos = ['Corte', 'Barba', 'Corte + Barba', 'Pigmentação', 'Design de Barba'];

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDataHora(getInitialDateTime(selectedDate, selectedHora));
  }, [visible, selectedDate, selectedHora]);

  const handleCriar = () => {
    if (!clienteNome || !clienteTelefone || !servico) {
      alert('Preencha todos os campos');
      return;
    }

    criarAgendamento(
      {
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        servico,
        data_hora: dataHora.toISOString(),
      },
      {
        onSuccess: () => {
          setClienteNome('');
          setClienteTelefone('');
          setServico('');
          onClose();
        },
        onError: (error) => {
          console.error('Erro ao criar agendamento:', error);
          alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        },
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Novo Agendamento</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.white} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <ClienteAutocompleteFields
              visible={visible}
              clienteNome={clienteNome}
              clienteTelefone={clienteTelefone}
              setClienteNome={setClienteNome}
              setClienteTelefone={setClienteTelefone}
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
              label="Data e Hora"
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
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleCriar} disabled={isPending}>
              {isPending ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.buttonTextPrimary}>Criar</Text>
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
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: COLORS.background,
    fontWeight: '700',
  },
});
