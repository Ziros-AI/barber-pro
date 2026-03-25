import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Pencil, Trash2, X } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { useCreateProduto, useDeleteProduto, useUpdateProduto } from '../hooks/useProduto';
import { useAlert } from '../../../app/providers/AlertProvider';
import type { Produto } from '../../../types';

interface NovoProdutoModalProps {
  visible: boolean;
  onClose: () => void;
  produto?: Produto | null;
}

export const NovoProdutoModal: React.FC<NovoProdutoModalProps> = ({
  visible,
  onClose,
  produto,
}) => {
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');

  const { mutate: criarProduto, isPending } = useCreateProduto();
  const { mutate: atualizarProduto, isPending: isUpdating } = useUpdateProduto();
  const { mutate: excluirProduto, isPending: isDeleting } = useDeleteProduto();
  const { showAlert, showConfirm } = useAlert();

  const isEditing = !!produto;
  const isSubmitting = isPending || isUpdating || isDeleting;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setNome(produto?.nome || '');
    setMarca(produto?.marca || '');
    setPreco(produto?.preco !== undefined ? String(produto.preco) : '');
    setEstoque(produto?.estoque !== undefined ? String(produto.estoque) : '');
    setEstoqueMinimo(produto?.estoque_minimo !== undefined ? String(produto.estoque_minimo) : '');
    setPrecoCusto(produto?.preco_custo !== undefined ? String(produto.preco_custo) : '');
  }, [produto, visible]);

  const resetForm = () => {
    setNome('');
    setMarca('');
    setPreco('');
    setEstoque('');
    setEstoqueMinimo('');
    setPrecoCusto('');
  };

  const buildPayload = () => ({
    nome: nome.trim(),
    marca: marca.trim(),
    preco: parseFloat(preco.replace(',', '.')),
    estoque: estoque ? parseInt(estoque, 10) : 0,
    estoque_minimo: estoqueMinimo ? parseInt(estoqueMinimo, 10) : 0,
    preco_custo: precoCusto ? parseFloat(precoCusto.replace(',', '.')) : 0,
  });

  const handleSalvar = () => {
    if (!nome.trim() || !preco.trim()) {
      showAlert('Campos obrigatórios', 'Preencha nome e preço do produto.', 'warning');
      return;
    }

    const payload = buildPayload();

    const onSuccess = () => {
      resetForm();
      onClose();
      showAlert(
        'Sucesso',
        isEditing ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.',
        'success'
      );
    };

    const onError = (error: unknown) => {
      console.error('Erro ao salvar produto:', error);
      showAlert(
        'Erro',
        `Não foi possível salvar o produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'error'
      );
    };

    if (isEditing && produto?.id) {
      atualizarProduto(
        {
          id: produto.id,
          data: payload,
        },
        { onSuccess, onError }
      );
      return;
    }

    criarProduto(payload, { onSuccess, onError });
  };

  const handleExcluir = () => {
    if (!produto?.id) {
      return;
    }

    showConfirm(
      'Excluir produto',
      `Deseja excluir o produto ${produto.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirProduto(produto.id, {
              onSuccess: () => {
                resetForm();
                onClose();
                showAlert('Sucesso', 'Produto excluído com sucesso.', 'success');
              },
              onError: (error) => {
                console.error('Erro ao excluir produto:', error);
                showAlert(
                  'Erro',
                  `Não foi possível excluir o produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                  'error'
                );
              },
            }),
        },
      ],
      'warning'
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{isEditing ? 'Editar Produto' : 'Novo Produto'}</Text>
                <Text style={styles.subtitle}>
                  {isEditing ? 'Atualize os dados do item selecionado' : 'Cadastre um item para usar no caixa'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <X color={COLORS.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Gel para cabelo"
                  placeholderTextColor={COLORS.zinc600}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Marca</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Linha Premium"
                  placeholderTextColor={COLORS.zinc600}
                  value={marca}
                  onChangeText={setMarca}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Preço de venda *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 49.90"
                    placeholderTextColor={COLORS.zinc600}
                    value={preco}
                    onChangeText={setPreco}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Preço de custo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 28.50"
                    placeholderTextColor={COLORS.zinc600}
                    value={precoCusto}
                    onChangeText={setPrecoCusto}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Estoque atual</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 10"
                    placeholderTextColor={COLORS.zinc600}
                    value={estoque}
                    onChangeText={setEstoque}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Estoque mínimo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 3"
                    placeholderTextColor={COLORS.zinc600}
                    value={estoqueMinimo}
                    onChangeText={setEstoqueMinimo}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              {isEditing ? (
                <TouchableOpacity
                  style={[styles.button, styles.buttonDanger]}
                  onPress={handleExcluir}
                  disabled={isSubmitting}
                >
                  <Trash2 color={COLORS.white} size={16} />
                  <Text style={styles.buttonText}>Excluir</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSalvar}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <View style={styles.primaryButtonContent}>
                    {isEditing ? <Pencil color={COLORS.background} size={16} /> : null}
                    <Text style={styles.buttonTextPrimary}>{isEditing ? 'Salvar' : 'Criar'}</Text>
                  </View>
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
  keyboardAvoidingView: {
    flex: 1,
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.zinc400,
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  buttonPrimary: {
    backgroundColor: COLORS.gold,
  },
  buttonDanger: {
    backgroundColor: COLORS.red,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: COLORS.background,
    fontWeight: '700',
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
