import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../../services/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, DollarSign, Package, Plus } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { NovoProdutoModal } from '../components/NovoProdutoModal';
import type { Produto } from '../../../types';
import { useAuth } from '../../../app/providers/AuthProvider';

export default function ProdutosScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const { user } = useAuth();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('user_id', user!.id)
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data || []) as Produto[];
    },
  });

  const resumo = useMemo(() => {
    const totalProdutos = produtos.length;
    const valorTotalEstoque = produtos.reduce(
      (total, produto) => total + Number(produto.preco_custo || 0) * Number(produto.estoque || 0),
      0
    );
    const valorLucro = produtos.reduce(
      (total, produto) =>
        total +
        (Number(produto.preco || 0) - Number(produto.preco_custo || 0)) * Number(produto.estoque || 0),
      0
    );
    const estoqueBaixo = produtos.filter(
      (produto) => Number(produto.estoque || 0) <= Number(produto.estoque_minimo || 0)
    ).length;

    return {
      totalProdutos,
      valorTotalEstoque,
      valorLucro,
      estoqueBaixo,
    };
  }, [produtos]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Produtos</Text>
            <Text style={styles.subtitle}>Gerencie o estoque e acompanhe seus itens</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setProdutoSelecionado(null);
              setModalVisible(true);
            }}
          >
            <Plus color={COLORS.background} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, styles.summaryIconGreenDark]}>
                <DollarSign color={COLORS.white} size={18} />
              </View>
              <Text style={styles.summaryLabel}>Valor de lucro</Text>
              <Text style={styles.summaryValue}>R$ {resumo.valorLucro.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, styles.summaryIconGreen]}>
                <DollarSign color={COLORS.background} size={18} />
              </View>
              <Text style={styles.summaryLabel}>Valor em estoque</Text>
              <Text style={styles.summaryValue}>R$ {resumo.valorTotalEstoque.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, styles.summaryIconGold]}>
                <Package color={COLORS.background} size={18} />
              </View>
              <Text style={styles.summaryLabel}>Produtos</Text>
              <Text style={styles.summaryValue}>{resumo.totalProdutos}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, styles.summaryIconOrange]}>
                <AlertTriangle color={COLORS.background} size={18} />
              </View>
              <Text style={styles.summaryLabel}>Estoque Baixo</Text>
              <Text style={styles.summaryValue}>{resumo.estoqueBaixo}</Text>
            </View>
          </View>

          {produtos.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Package color={COLORS.gold} size={28} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
              <Text style={styles.emptyText}>
                Adicione seus primeiros itens para acompanhar preços, custo e estoque no caixa.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => {
                  setProdutoSelecionado(null);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.emptyButtonText}>Cadastrar produto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            produtos.map((produto) => {
              const estoque = Number(produto.estoque || 0);
              const estoqueMinimo = Number(produto.estoque_minimo || 0);
              const estoqueStatusStyle =
                estoque <= 0
                  ? styles.stockBadgeLow
                  : estoque <= estoqueMinimo
                    ? styles.stockBadgeMedium
                    : styles.stockBadgeHigh;
              const estoqueTextStyle =
                estoque <= 0
                  ? styles.stockTextLow
                  : estoque <= estoqueMinimo
                    ? styles.stockTextMedium
                    : styles.stockTextHigh;

              return (
                <TouchableOpacity
                  key={produto.id}
                  style={styles.productCard}
                  activeOpacity={0.92}
                  onPress={() => {
                    setProdutoSelecionado(produto);
                    setModalVisible(true);
                  }}
                >
                  <View style={styles.productHeader}>
                    <View style={styles.productLeft}>
                      <View style={styles.iconCircle}>
                        <Package color={COLORS.background} size={22} />
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{produto.nome}</Text>
                        <Text style={styles.productBrand}>{produto.marca || 'Marca não informada'}</Text>
                      </View>
                    </View>

                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>R$ {Number(produto.preco || 0).toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.footerColumn}>
                      <Text style={styles.footerLabel}>Estoque atual</Text>
                      <Text style={styles.footerValue}>{estoque} UN</Text>
                    </View>

                    <View style={styles.footerColumn}>
                      <Text style={styles.footerLabel}>Estoque mínimo</Text>
                      <Text style={styles.footerValue}>{estoqueMinimo} UN</Text>
                    </View>

                    <View style={styles.footerColumn}>
                      <Text style={styles.footerLabel}>Preço de custo</Text>
                      <Text style={styles.footerValue}>R$ {Number(produto.preco_custo || 0).toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.productFooter}>
                    <View style={[styles.stockBadge, estoqueStatusStyle]}>
                      <Text style={[styles.stockBadgeText, estoqueTextStyle]}>
                        {estoque <= 0 ? 'Sem estoque' : estoque <= estoqueMinimo ? 'Atenção' : 'OK'}
                      </Text>
                    </View>
                    <Text style={styles.cardHint}>Toque para editar ou excluir</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <NovoProdutoModal
        visible={modalVisible}
        produto={produtoSelecionado}
        onClose={() => {
          setModalVisible(false);
          setProdutoSelecionado(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.cardBg,
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc400,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: COLORS.gold,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIconGold: {
    backgroundColor: COLORS.gold,
  },
  summaryIconGreen: {
    backgroundColor: COLORS.green,
  },
  summaryIconGreenDark: {
    backgroundColor: COLORS.greenDark,
  },
  summaryIconOrange: {
    backgroundColor: COLORS.orange,
  },
  summaryLabel: {
    color: COLORS.zinc400,
    fontSize: 13,
    marginBottom: 6,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  productCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  productLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    backgroundColor: COLORS.orange,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 13,
    color: COLORS.zinc400,
  },
  priceTag: {
    backgroundColor: `${COLORS.green}20`,
    borderWidth: 1,
    borderColor: `${COLORS.green}40`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceText: {
    color: COLORS.green,
    fontWeight: '800',
    fontSize: 14,
  },
  detailsGrid: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerColumn: {
    minWidth: '30%',
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  productFooter: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  stockBadgeHigh: {
    backgroundColor: `${COLORS.green}18`,
    borderColor: `${COLORS.green}40`,
  },
  stockBadgeMedium: {
    backgroundColor: `${COLORS.yellow}18`,
    borderColor: `${COLORS.yellow}40`,
  },
  stockBadgeLow: {
    backgroundColor: `${COLORS.red}18`,
    borderColor: `${COLORS.red}40`,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockTextHigh: {
    color: COLORS.green,
  },
  stockTextMedium: {
    color: COLORS.yellow,
  },
  stockTextLow: {
    color: COLORS.red,
  },
  cardHint: {
    color: COLORS.zinc500,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.gold}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.zinc400,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  emptyButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 14,
  },
});
