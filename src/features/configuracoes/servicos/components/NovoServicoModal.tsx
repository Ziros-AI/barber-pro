import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../../../styles/colors';
import { useCreateServico } from '../hooks/useServicos';

interface NovoServicoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NovoServicoModal: React.FC<NovoServicoModalProps> = ({ visible, onClose }) => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');

  const { mutate: criarServico, isPending } = useCreateServico();

  const precoNumero = Number(preco.replace(',', '.'));
  const duracaoNumero = Number(duracao);

  const camposValidos =
    nome.trim().length > 0 &&
    precoNumero > 0 &&
    duracaoNumero > 0;

  const handleCriar = () => {
    if (!camposValidos) {
      alert('Preencha todos os campos corretamente');
      return;
    }

    criarServico(
      {
        nome,
        preco: precoNumero,
        duracao: duracaoNumero,
      },
      {
        onSuccess: () => {
          setNome('');
          setPreco('');
          setDuracao('');
          onClose();
        },
        onError: (error) => {
          console.error('Erro ao criar serviço:', error);
          alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        },
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            
            <View style={styles.header}>
              <Text style={styles.title}>Novo Serviço</Text>
              <TouchableOpacity onPress={onClose}>
                <X color={COLORS.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Corte degradê"
                  placeholderTextColor={COLORS.zinc600}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preço *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 35.00"
                  placeholderTextColor={COLORS.zinc600}
                  value={preco}
                  onChangeText={setPreco}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duração (minutos) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 30"
                  placeholderTextColor={COLORS.zinc600}
                  value={duracao}
                  onChangeText={setDuracao}
                  keyboardType="numeric"
                />
              </View>

            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  (!camposValidos || isPending) && styles.buttonPrimaryDisabled,
                ]}
                onPress={handleCriar}
                disabled={!camposValidos || isPending}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Text style={styles.buttonTextPrimary}>Criar</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '70%',
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