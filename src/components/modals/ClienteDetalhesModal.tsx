import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';
import { useDeleteCliente, useUpdateCliente } from '../../hooks/useCliente';
import { useAlert } from '../../app/providers/AlertProvider';

interface ClienteData {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  frequencia_dias?: number;
}

interface ClienteDetalhesModalProps {
  visible: boolean;
  cliente: ClienteData | null;
  onClose: () => void;
}

export const ClienteDetalhesModal: React.FC<ClienteDetalhesModalProps> = ({
  visible,
  cliente,
  onClose,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [frequenciaDias, setFrequenciaDias] = useState('30');

  const { mutate: atualizarCliente, isPending: isUpdating } = useUpdateCliente();
  const { mutate: excluirCliente, isPending: isDeleting } = useDeleteCliente();
  const { showAlert, showConfirm } = useAlert();

  const isPending = isUpdating || isDeleting;

  useEffect(() => {
    if (!cliente) return;

    setNome(cliente.nome || '');
    setEmail(cliente.email || '');
    setTelefone(cliente.telefone || '');
    setFrequenciaDias(String(cliente.frequencia_dias || 30));
  }, [cliente]);

  const isDisabled = useMemo(() => !cliente || isPending, [cliente, isPending]);

  const handleSalvar = () => {
    if (!cliente) return;
    if (!nome.trim()) {
      showAlert('Campo obrigatório', 'Preencha o nome do cliente.', 'warning');
      return;
    }

    const frequenciaNumerica = Number(frequenciaDias);
    if (!Number.isFinite(frequenciaNumerica) || frequenciaNumerica <= 0) {
      showAlert('Frequência inválida', 'Informe uma frequência em dias maior que zero.', 'warning');
      return;
    }

    atualizarCliente(
      {
        id: cliente.id,
        data: {
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          frequencia_dias: frequenciaNumerica,
        },
      },
      {
        onSuccess: () => {
          showAlert('Sucesso', 'Cliente atualizado com sucesso.', 'success');
          onClose();
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Erro ao atualizar cliente.';
          showAlert('Erro', message, 'error');
        },
      }
    );
  };

  const confirmarExclusao = () => {
    if (!cliente) return;

    showConfirm(
      'Excluir cliente',
      `Tem certeza que deseja excluir ${cliente.nome}? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            excluirCliente(cliente.id, {
              onSuccess: () => {
                showAlert('Cliente removido', 'Cliente excluído com sucesso.', 'success');
                onClose();
              },
              onError: (error) => {
                const message =
                  error instanceof Error ? error.message : 'Erro ao excluir cliente.';
                showAlert('Erro', message, 'error');
              },
            });
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar Cliente</Text>
            <TouchableOpacity onPress={onClose} disabled={isPending}>
              <X color={COLORS.white} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: João Silva"
                placeholderTextColor={COLORS.zinc600}
                value={nome}
                onChangeText={setNome}
                editable={!isDisabled}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: joao@email.com"
                placeholderTextColor={COLORS.zinc600}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isDisabled}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 11999999999"
                placeholderTextColor={COLORS.zinc600}
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                editable={!isDisabled}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequência (dias)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 30"
                placeholderTextColor={COLORS.zinc600}
                value={frequenciaDias}
                onChangeText={setFrequenciaDias}
                keyboardType="number-pad"
                editable={!isDisabled}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={confirmarExclusao}
              disabled={isDisabled}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <View style={styles.deleteContent}>
                  <Trash2 color={COLORS.white} size={16} />
                  <Text style={styles.buttonText}>Excluir</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={isPending}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSalvar}
              disabled={isDisabled}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.buttonTextPrimary}>Salvar</Text>
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
    maxHeight: '78%',
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
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDanger: {
    backgroundColor: COLORS.red,
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
  deleteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
