import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { format } from 'date-fns';
import { COLORS } from '../../styles/colors';

interface ProdutoVendido {
  nome?: string;
  quantidade?: number;
  preco?: number;
  preco_unitario?: number;
  subtotal?: number;
}

interface VendaDetalhes {
  id: string;
  created_at: string;
  valor_total: number;
  valor_servico: number;
  forma_pagamento?: string | null;
  produtos_vendidos?: ProdutoVendido[] | null;
  cliente?: {
    nome?: string | null;
  } | null;
}

interface VendaDetalhesModalProps {
  visible: boolean;
  onClose: () => void;
  venda: VendaDetalhes | null;
}

const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

export const VendaDetalhesModal: React.FC<VendaDetalhesModalProps> = ({
  visible,
  onClose,
  venda
}) => {
  if (!venda) {
    return null;
  }

  const produtos = Array.isArray(venda.produtos_vendidos) ? venda.produtos_vendidos : [];
  const subtotalProdutos = produtos.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const clienteNome = venda.cliente?.nome?.trim() || 'Cliente não informado';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Detalhes da venda</Text>
              <Text style={styles.subtitle}>{clienteNome}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={COLORS.white} size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Cliente</Text>
                <Text style={styles.value}>{clienteNome}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Data</Text>
                <Text style={styles.value}>
                  {format(new Date(venda.created_at), 'dd/MM/yyyy HH:mm')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Serviço</Text>
                <Text style={styles.value}>{formatCurrency(venda.valor_servico || 0)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Pagamento</Text>
                <Text style={styles.value}>{venda.forma_pagamento || 'Não informado'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Produtos</Text>
              {produtos.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum produto foi adicionado nesta venda.</Text>
              ) : (
                produtos.map((item, index) => {
                  const precoUnitario = item.preco_unitario || item.preco || 0;
                  const quantidade = item.quantidade || 0;
                  const subtotal = item.subtotal || precoUnitario * quantidade;

                  return (
                    <View key={`${item.nome || 'produto'}-${index}`} style={styles.productItem}>
                      <Text style={styles.productName}>{item.nome || 'Produto sem nome'}</Text>
                      <Text style={styles.productMeta}>
                        {quantidade}x {formatCurrency(precoUnitario)}
                      </Text>
                      <Text style={styles.productSubtotal}>{formatCurrency(subtotal)}</Text>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.totalCard}>
              <View style={styles.row}>
                <Text style={styles.totalLabel}>Subtotal produtos</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotalProdutos)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.totalLabel}>Serviço</Text>
                <Text style={styles.totalValue}>{formatCurrency(venda.valor_servico || 0)}</Text>
              </View>
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.grandTotalLabel}>Total geral</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(venda.valor_total || 0)}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.zinc400,
    fontSize: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.zinc800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  label: {
    color: COLORS.zinc400,
    fontSize: 14,
    flex: 1,
  },
  value: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  emptyText: {
    color: COLORS.zinc500,
    fontSize: 14,
  },
  productItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
    paddingTop: 12,
    marginTop: 12,
  },
  productName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  productMeta: {
    color: COLORS.zinc400,
    fontSize: 13,
    marginBottom: 4,
  },
  productSubtotal: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  totalCard: {
    backgroundColor: `${COLORS.gold}18`,
    borderWidth: 1,
    borderColor: `${COLORS.gold}35`,
    borderRadius: 16,
    padding: 16,
  },
  totalLabel: {
    color: COLORS.zinc300,
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: `${COLORS.gold}35`,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  grandTotalLabel: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '800',
  },
  grandTotalValue: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '900',
  },
});
