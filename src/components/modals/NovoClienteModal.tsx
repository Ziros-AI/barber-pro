import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';
import { useCreateCliente } from '../../hooks/useCliente';
import { formatPhoneNumber } from '../shared/ClienteAutocompleteFields';
import { isValidPhone } from '../../lib/utils';
import { KeyboardAvoidingView, Platform } from 'react-native';

interface NovoClienteModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NovoClienteModal: React.FC<NovoClienteModalProps> = ({ visible, onClose }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const { mutate: criarCliente, isPending } = useCreateCliente();
  const telefoneValido = isValidPhone(telefone);
  const camposObrigatoriosPreenchidos = nome.trim().length > 0 && telefoneValido;

  const handleCriar = () => {
    if (!nome || !telefone) {
      alert('Preencha o nome e o telefone do cliente');
      return;
    }

    if (!telefoneValido) {
      alert('Digite um telefone válido com DDD');
      return;
    }

    criarCliente({
      nome,
      email: email || '',
      telefone,
    }, {
      onSuccess: () => {
        setNome('');
        setEmail('');
        setTelefone('');
        onClose();
      },
      onError: (error) => {
        console.error('Erro ao criar cliente:', error);
        alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    });
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
              <Text style={styles.title}>Novo Cliente</Text>
              <TouchableOpacity onPress={onClose}>
                <X color={COLORS.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do cliente"
                  placeholderTextColor={COLORS.zinc600}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email do cliente"
                  placeholderTextColor={COLORS.zinc600}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o telefone do cliente"
                  placeholderTextColor={COLORS.zinc600}
                  value={formatPhoneNumber(telefone)}
                  onChangeText={(value) => setTelefone(value.replace(/\D/g, '').slice(0, 11))}
                  keyboardType="phone-pad"
                />
                {telefone.length > 0 && !telefoneValido && (
                  <Text style={styles.errorText}>Digite um telefone válido com DDD.</Text>
                )}
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
                  (!camposObrigatoriosPreenchidos || isPending) && styles.buttonPrimaryDisabled,
                ]}
                onPress={handleCriar}
                disabled={isPending || !camposObrigatoriosPreenchidos}
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
  errorText: {
    color: COLORS.red,
    marginTop: 8,
    fontSize: 12,
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
