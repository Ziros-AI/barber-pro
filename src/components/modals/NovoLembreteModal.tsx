import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';
import { useCreateLembrete } from '../../hooks/useLembrete';

interface NovoLembreteModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NovoLembreteModal: React.FC<NovoLembreteModalProps> = ({ visible, onClose }) => {
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [servico, setServico] = useState('');
  const [dataEnvio, setDataEnvio] = useState('');
  const [hora, setHora] = useState('');
  const [mensagem, setMensagem] = useState('');

  const { mutate: criarLembrete, isPending } = useCreateLembrete();

  const handleSubmit = () => {
    if (!clienteNome || !clienteTelefone || !servico || !dataEnvio || !hora || !mensagem) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    // Combinar data e hora no formato ISO
    const [ano, mes, dia] = dataEnvio.split('-');
    const dataHora = `${ano}-${mes}-${dia}T${hora}:00.000Z`;

    criarLembrete({
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
      servico,
      data_envio: dataHora,
      mensagem,
      status: 'pendente'
    }, {
      onSuccess: () => {
        Alert.alert('Sucesso', 'Lembrete criado com sucesso!');
        setClienteNome('');
        setClienteTelefone('');
        setServico('');
        setDataEnvio('');
        setHora('');
        setMensagem('');
        onClose();
      },
      onError: (error: any) => {
        Alert.alert('Erro', `Não foi possível criar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Novo Lembrete</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={COLORS.zinc400} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Cliente</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: João Silva"
                placeholderTextColor={COLORS.zinc600}
                value={clienteNome}
                onChangeText={setClienteNome}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone (WhatsApp)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 11999999999"
                placeholderTextColor={COLORS.zinc600}
                value={clienteTelefone}
                onChangeText={setClienteTelefone}
                keyboardType="phone-pad"
              />
            </View>

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

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Data</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={COLORS.zinc600}
                  value={dataEnvio}
                  onChangeText={setDataEnvio}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Hora</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.zinc600}
                  value={hora}
                  onChangeText={setHora}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensagem</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Olá {cliente}, lembrete do seu {servico} amanhã..."
                placeholderTextColor={COLORS.zinc600}
                value={mensagem}
                onChangeText={setMensagem}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.submitButtonText}>Criar Lembrete</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
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
    padding: 24,
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  submitButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
});
