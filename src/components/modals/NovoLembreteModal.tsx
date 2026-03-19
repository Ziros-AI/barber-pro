import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';
import { useCreateLembrete } from '../../hooks/useLembrete';
import { ClienteAutocompleteFields } from '../shared/ClienteAutocompleteFields';
import { DateTimeField } from '../shared/DateTimeField';
import { FormNotice } from '../shared/FormNotice';

interface NovoLembreteModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NovoLembreteModal: React.FC<NovoLembreteModalProps> = ({ visible, onClose }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteValido, setClienteValido] = useState(false);
  const [servico, setServico] = useState('');
  const [dataHora, setDataHora] = useState(new Date());
  const [mensagem, setMensagem] = useState('');
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);

  const { mutate: criarLembrete, isPending } = useCreateLembrete();

  useEffect(() => {
    if (!visible) {
      return;
    }

    setClienteNome('');
    setClienteTelefone('');
    setClienteValido(false);
    setServico('');
    setDataHora(new Date());
    setMensagem('');
    setFeedback(null);
  }, [visible]);

  const handleSubmit = () => {
    setFeedback(null);

    if (!clienteNome || !clienteTelefone || !servico || !mensagem) {
      setFeedback({
        title: 'Campos incompletos',
        message: 'Preencha cliente, telefone, serviço e mensagem antes de criar o lembrete.',
      });
      return;
    }

    if (!clienteValido) {
      setFeedback({
        title: 'Cliente não encontrado',
        message: 'Selecione um cliente já cadastrado antes de criar o lembrete.',
      });
      return;
    }

    criarLembrete(
      {
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        servico,
        data_envio: dataHora.toISOString(),
        mensagem,
        status: 'pendente',
      },
      {
        onSuccess: () => {
          setFeedback(null);
          onClose();
        },
        onError: (error) => {
          console.error('Erro ao criar cliente:', error);
          setFeedback({
            title: 'Não foi possível criar',
            message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
          });
        },
      }
    );
  };

  const handleMensagemFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Novo Lembrete</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={COLORS.zinc400} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            {feedback && <FormNotice type="error" title={feedback.title} message={feedback.message} />}

            <ClienteAutocompleteFields
              visible={visible}
              clienteNome={clienteNome}
              clienteTelefone={clienteTelefone}
              setClienteNome={setClienteNome}
              setClienteTelefone={setClienteTelefone}
              onClienteValidoChange={setClienteValido}
              inputBackgroundColor={COLORS.cardBg}
              labelTelefone="Telefone (WhatsApp)"
              inputGroupStyle={styles.inputGroup}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Serviço</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Corte de Cabelo"
                placeholderTextColor={COLORS.zinc600}
                value={servico}
                onChangeText={setServico}
              />
            </View>

            <DateTimeField
              value={dataHora}
              onChange={setDataHora}
              inputBackgroundColor={COLORS.cardBg}
              inputBorderWidth={2}
              containerStyle={styles.inputGroup}
              labelStyle={styles.label}
              inputStyle={styles.input}
              pickerCardStyle={styles.pickerCard}
              pickerLabelStyle={styles.label}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensagem</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Olá {cliente}, lembrete do seu {servico} amanhã..."
                placeholderTextColor={COLORS.zinc600}
                value={mensagem}
                onChangeText={setMensagem}
                onFocus={handleMensagemFocus}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!clienteValido || isPending) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isPending || !clienteValido}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.submitButtonText}>Criar Lembrete</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc800,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  formContent: {
    paddingBottom: 280,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    color: COLORS.white,
    fontSize: 16,
    borderWidth: 2,
    borderColor: COLORS.zinc800,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  pickerCard: {
    borderWidth: 2,
  },
  submitButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
});
