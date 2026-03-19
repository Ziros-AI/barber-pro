import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../services/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Package, DollarSign, Plus } from 'lucide-react-native';
import { COLORS } from '../styles/colors';
import { NovoProdutoModal } from '../components/modals/NovoProdutoModal';

export default function ProdutosScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Produtos</Text>
            <Text style={styles.subtitle}>{produtos.length} produtos cadastrados</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus color={COLORS.background} size={24} />
          </TouchableOpacity>
        </View>

      <View style={styles.content}>
        {produtos.map((produto: any) => (
          <View key={produto.id} style={styles.produtoCard}>
            <View style={styles.produtoHeader}>
              <View style={styles.produtoLeft}>
                <View style={styles.iconCircle}>
                  <Package color={COLORS.background} size={24} />
                </View>
                <View style={styles.produtoInfo}>
                  <Text style={styles.produtoNome}>{produto.nome}</Text>
                  {produto.marca && (
                    <Text style={styles.produtoMarca}>{produto.marca}</Text>
                  )}
                </View>
              </View>
              <View style={styles.precoTag}>
                <Text style={styles.precoText}>
                  R$ {produto.preco?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
            
            {produto.estoque !== undefined && (
              <View style={styles.estoqueRow}>
                <Text style={styles.estoqueLabel}>Estoque</Text>
                <Text style={[
                  styles.estoqueValue,
                  produto.estoque > 10 
                    ? styles.estoqueAlto 
                    : produto.estoque > 0 
                    ? styles.estoqueMedio 
                    : styles.estoqueBaixo
                ]}>
                  {produto.estoque} unidades
                </Text>
              </View>
            )}
          </View>
        ))}

        {produtos.length === 0 && (
          <View style={styles.emptyState}>
            <Package color={COLORS.zinc500} size={48} />
            <Text style={styles.emptyText}>
              Nenhum produto cadastrado
            </Text>
          </View>
        )}
      </View>
    </ScrollView>

    <NovoProdutoModal 
      visible={modalVisible} 
      onClose={() => setModalVisible(false)} 
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  addButton: {
    backgroundColor: COLORS.gold,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.cardBg,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 16,
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
  },
  content: {
    padding: 16,
  },
  produtoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  produtoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  produtoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    backgroundColor: COLORS.orange,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  produtoMarca: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  precoTag: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  precoText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  estoqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
  },
  estoqueLabel: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  estoqueValue: {
    fontWeight: '700',
  },
  estoqueAlto: {
    color: '#22c55e',
  },
  estoqueMedio: {
    color: '#eab308',
  },
  estoqueBaixo: {
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.zinc400,
    textAlign: 'center',
    marginTop: 16,
  },
});
