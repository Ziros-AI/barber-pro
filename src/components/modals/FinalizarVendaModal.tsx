import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { X, Plus, Minus, DollarSign } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';
import { useCreateVenda } from '../../hooks/useVenda';
import { useUpdateAgendamento } from '../../hooks/useAgendamento';
import { useUpdateProduto } from '../../hooks/useProduto';
import { useQueryClient } from '@tanstack/react-query';

interface Agendamento {
  id: string;
  cliente_nome: string;
  servico: string;
  data_hora: string;
  valor?: number;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
}

interface ProdutoSelecionado {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco: number;
  subtotal: number;
}

interface FinalizarVendaModalProps {
  visible: boolean;
  onClose: () => void;
  agendamento: Agendamento;
  produtos: Produto[];
}

export const FinalizarVendaModal: React.FC<FinalizarVendaModalProps> = ({ 
  visible, 
  onClose, 
  agendamento,
  produtos 
}) => {
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');

  const queryClient = useQueryClient();
  const { mutate: criarVenda, isPending: criandoVenda } = useCreateVenda();
  const { mutate: atualizarAgendamento } = useUpdateAgendamento();
  const { mutate: atualizarProduto } = useUpdateProduto();

  const valorServico = agendamento.valor || 50; // Padrão se não tiver valor
  const valorProdutos = produtosSelecionados.reduce((sum, p) => sum + p.subtotal, 0);
  const valorTotal = valorServico + valorProdutos;

  const adicionarProduto = (produto: Produto) => {
    const existe = produtosSelecionados.find(p => p.produto_id === produto.id);
    
    if (existe) {
      if (existe.quantidade >= produto.estoque) {
        Alert.alert('Estoque insuficiente', `Disponível: ${produto.estoque} unidades`);
        return;
      }
      setProdutosSelecionados(
        produtosSelecionados.map(p =>
          p.produto_id === produto.id
            ? { ...p, quantidade: p.quantidade + 1, subtotal: (p.quantidade + 1) * p.preco }
            : p
        )
      );
    } else {
      if (produto.estoque < 1) {
        Alert.alert('Sem estoque', 'Este produto está sem estoque');
        return;
      }
      setProdutosSelecionados([
        ...produtosSelecionados,
        {
          produto_id: produto.id,
          nome: produto.nome,
          quantidade: 1,
          preco: produto.preco,
          subtotal: produto.preco
        }
      ]);
    }
  };

  const removerProduto = (produtoId: string) => {
    const produto = produtosSelecionados.find(p => p.produto_id === produtoId);
    if (!produto) return;

    if (produto.quantidade > 1) {
      setProdutosSelecionados(
        produtosSelecionados.map(p =>
          p.produto_id === produtoId
            ? { ...p, quantidade: p.quantidade - 1, subtotal: (p.quantidade - 1) * p.preco }
            : p
        )
      );
    } else {
      setProdutosSelecionados(produtosSelecionados.filter(p => p.produto_id !== produtoId));
    }
  };

  const handleFinalizar = async () => {
    criarVenda({
      valor_servico: valorServico,
      valor_total: valorTotal,
      produtos_vendidos: produtosSelecionados,
      cliente_id: undefined
    }, {
      onSuccess: () => {
        // Atualizar status do agendamento para finalizado
        atualizarAgendamento({
          id: agendamento.id,
          data: { status: 'finalizado' }
        });

        // Decrementar estoque dos produtos
        produtosSelecionados.forEach(item => {
          const produto = produtos.find(p => p.id === item.produto_id);
          if (produto) {
            atualizarProduto({
              id: produto.id,
              data: { estoque: produto.estoque - item.quantidade }
            });
          }
        });

        // Invalidar queries para atualizar listas
        queryClient.invalidateQueries({ queryKey: ['agendamentos-hoje-confirmados'] });
        queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
        queryClient.invalidateQueries({ queryKey: ['produtos'] });
        queryClient.invalidateQueries({ queryKey: ['vendas'] });
        queryClient.invalidateQueries({ queryKey: ['vendas-hoje'] });

        Alert.alert('Sucesso', 'Venda finalizada com sucesso!');
        setProdutosSelecionados([]);
        setFormaPagamento('Dinheiro');
        onClose();
      },
      onError: (error) => {
        Alert.alert('Erro', `Não foi possível finalizar a venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    });
  };

  const formasPagamento = ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{agendamento.cliente_nome}</Text>
              <Text style={styles.subtitle}>{agendamento.servico}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.white} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.valorServicoCard}>
              <Text style={styles.valorServicoLabel}>Serviço</Text>
              <Text style={styles.valorServicoValue}>R$ {valorServico.toFixed(2)}</Text>
            </View>

            <Text style={styles.sectionTitle}>Adicionar Produtos</Text>
            <View style={styles.produtosGrid}>
              {produtos.map(produto => {
                const selecionado = produtosSelecionados.find(p => p.produto_id === produto.id);
                return (
                  <View key={produto.id} style={styles.produtoCard}>
                    <Text style={styles.produtoNome} numberOfLines={1}>{produto.nome}</Text>
                    <Text style={styles.produtoPreco}>R$ {produto.preco.toFixed(2)}</Text>
                    <Text style={styles.produtoEstoque}>Estoque: {produto.estoque}</Text>
                    
                    {selecionado ? (
                      <View style={styles.quantidadeControl}>
                        <TouchableOpacity
                          onPress={() => removerProduto(produto.id)}
                          style={styles.btnMinus}
                        >
                          <Minus color={COLORS.white} size={16} />
                        </TouchableOpacity>
                        <Text style={styles.quantidade}>{selecionado.quantidade}</Text>
                        <TouchableOpacity
                          onPress={() => adicionarProduto(produto)}
                          style={styles.btnPlus}
                        >
                          <Plus color={COLORS.white} size={16} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => adicionarProduto(produto)}
                        style={styles.btnAdicionar}
                        disabled={produto.estoque < 1}
                      >
                        <Text style={styles.btnAdicionarText}>
                          {produto.estoque < 1 ? 'Sem estoque' : '+ Adicionar'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {produtosSelecionados.length > 0 && (
              <View style={styles.resumoProdutos}>
                <Text style={styles.resumoTitle}>Produtos Selecionados</Text>
                {produtosSelecionados.map(item => (
                  <View key={item.produto_id} style={styles.resumoItem}>
                    <Text style={styles.resumoItemText}>
                      {item.nome} ({item.quantidade}x)
                    </Text>
                    <Text style={styles.resumoItemValue}>
                      R$ {item.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.resumoItem}>
                  <Text style={styles.resumoLabel}>Produtos</Text>
                  <Text style={styles.resumoValue}>R$ {valorProdutos.toFixed(2)}</Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
            <View style={styles.formasPagamento}>
              {formasPagamento.map(forma => (
                <TouchableOpacity
                  key={forma}
                  onPress={() => setFormaPagamento(forma)}
                  style={[
                    styles.formaPagamentoButton,
                    formaPagamento === forma && styles.formaPagamentoButtonActive
                  ]}
                >
                  <Text style={[
                    styles.formaPagamentoText,
                    formaPagamento === forma && styles.formaPagamentoTextActive
                  ]}>
                    {forma}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>R$ {valorTotal.toFixed(2)}</Text>
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
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleFinalizar}
              disabled={criandoVenda}
            >
              {criandoVenda ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.buttonTextPrimary}>Finalizar</Text>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  content: {
    paddingHorizontal: 20,
  },
  valorServicoCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  valorServicoLabel: {
    fontSize: 16,
    color: COLORS.zinc400,
  },
  valorServicoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
  },
  produtosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  produtoCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  produtoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  produtoPreco: {
    fontSize: 14,
    color: COLORS.gold,
    marginBottom: 2,
  },
  produtoEstoque: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginBottom: 8,
  },
  quantidadeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnMinus: {
    backgroundColor: '#dc2626',
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantidade: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  btnPlus: {
    backgroundColor: '#16a34a',
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAdicionar: {
    backgroundColor: COLORS.zinc800,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnAdicionarText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  resumoProdutos: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resumoItemText: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  resumoItemValue: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.zinc700,
    marginVertical: 12,
  },
  resumoLabel: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  resumoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
  },
  formasPagamento: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  formaPagamentoButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.zinc700,
  },
  formaPagamentoButtonActive: {
    borderColor: COLORS.gold,
    backgroundColor: `${COLORS.gold}20`,
  },
  formaPagamentoText: {
    fontSize: 14,
    color: COLORS.zinc400,
    fontWeight: '600',
  },
  formaPagamentoTextActive: {
    color: COLORS.gold,
  },
  totalCard: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.background,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.background,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: COLORS.zinc800,
  },
  buttonPrimary: {
    backgroundColor: COLORS.gold,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
});
