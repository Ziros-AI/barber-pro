import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { COLORS } from '../../../../styles/colors';
import { useAlert } from '../../../../app/providers/AlertProvider';
import { useCreateServico, useDeleteServico, useUpdateServico } from '../hooks/useServicos';

interface ServicoData {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface ServicoDetalhesModalProps {
  visible: boolean;
  servico: ServicoData | null;
  onClose: () => void;
}

export const ServicoDetalhesModal: React.FC<ServicoDetalhesModalProps> = ({
  visible,
  servico,
  onClose,
}) => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');

  const { showAlert, showConfirm } = useAlert();

  const { mutate: atualizarServico, isPending: isUpdating } = useUpdateServico();
  const { mutate: excluirServico, isPending: isDeleting } = useDeleteServico();

  const isPending = isUpdating || isDeleting;

  useEffect(() => {
    if (visible && servico) {
      setNome(servico.nome || '');
      setPreco(String(servico.preco || 0));
      setDuracao(String(servico.duracao || 0));
    }
  }, [visible]);

  const isDisabled = useMemo(() => !servico || isPending, [servico, isPending]);

  const handleSalvar = () => {
    if (!servico) return;
    if (!nome.trim()) {
      showAlert('Campo obrigatório', 'Preencha o nome do serviço.', 'warning');
      return;
    }

    const precoNum = parseFloat(preco.replace(',', '.'));
    const duracaoNum = parseInt(duracao);

    if (!Number.isFinite(precoNum) || precoNum <= 0) {
      showAlert('Preço inválido', 'Informe um preço maior que zero.', 'warning');
      return;
    }

    if (!Number.isFinite(duracaoNum) || duracaoNum <= 0) {
      showAlert('Duração inválida', 'Informe uma duração em minutos maior que zero.', 'warning');
      return;
    }

    atualizarServico(
      {
        id: servico.id,
        data: { nome: nome.trim(), preco: precoNum, duracao: duracaoNum },
      },
      {
        onSuccess: () => {
          onClose();

          setTimeout(() => {
            showAlert('Sucesso', 'Serviço atualizado com sucesso!', 'success');
          }, 100);
        },
        onError: (error) => {
          console.log('ERRO UPDATE:', error);
          const message = error instanceof Error ? error.message : 'Erro ao atualizar serviço.';
          showAlert('Erro', message, 'error');
        },
      }
    );
  };

  const confirmarExclusao = () => {
    if (!servico) return;

    Alert.alert(
      'Excluir serviço',
      `Tem certeza que deseja excluir ${servico.nome}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            excluirServico(servico.id, {
              onSuccess: () => {
                onClose();

                setTimeout(() => {
                  showAlert('Sucesso', 'Serviço excluído!', 'success');
                }, 100);
              },
            });
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Editar Serviço</Text>
              <TouchableOpacity onPress={onClose} disabled={isPending}>
                <X color={COLORS.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}
              keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Corte Masculino"
                  placeholderTextColor={COLORS.zinc600}
                  value={nome}
                  onChangeText={setNome}
                  editable={!isDisabled}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preço (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 50.00"
                  placeholderTextColor={COLORS.zinc600}
                  value={preco}
                  onChangeText={setPreco}
                  keyboardType="decimal-pad"
                  editable={!isDisabled}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duração (minutos)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 30"
                  placeholderTextColor={COLORS.zinc600}
                  value={duracao}
                  onChangeText={setDuracao}
                  keyboardType="number-pad"
                  editable={!isDisabled}
                />
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={confirmarExclusao}
                disabled={!servico}
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
      </KeyboardAvoidingView>
    </Modal >
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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