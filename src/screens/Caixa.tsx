import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Calendar } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COLORS } from '../styles/colors';

export default function CaixaScreen() {
  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ['vendas-todas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('data_hora', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const totalGeral = vendas.reduce((sum: number, v: any) => sum + v.valor_total, 0);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Caixa</Text>
        <Text style={styles.subtitle}>Controle financeiro</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Geral</Text>
          <Text style={styles.totalValue}>
            R$ {totalGeral.toFixed(2)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Últimas Vendas</Text>

        {vendas.map((venda: any) => (
          <View key={venda.id} style={styles.vendaCard}>
            <View style={styles.vendaHeader}>
              <View style={styles.vendaInfo}>
                <Text style={styles.vendaValor}>
                  R$ {venda.valor_total.toFixed(2)}
                </Text>
                <Text style={styles.vendaServico}>
                  Serviço: R$ {venda.valor_servico.toFixed(2)}
                </Text>
              </View>
              <View style={styles.iconCircle}>
                <DollarSign color={COLORS.background} size={20} />
              </View>
            </View>
            
            <View style={styles.dateRow}>
              <Calendar color={COLORS.zinc500} size={14} style={{ marginRight: 6 }} />
              <Text style={styles.dateText}>
                {format(parseISO(venda.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </Text>
            </View>

            {venda.produtos_vendidos && venda.produtos_vendidos.length > 0 && (
              <View style={styles.produtosSection}>
                <Text style={styles.produtosLabel}>Produtos vendidos:</Text>
                {venda.produtos_vendidos.map((p: any, i: number) => (
                  <Text key={i} style={styles.produtoItem}>
                    • {p.nome} ({p.quantidade}x) - R$ {p.subtotal.toFixed(2)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
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
  totalCard: {
    backgroundColor: COLORS.green,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  totalLabel: {
    color: '#dcfce7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalValue: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 36,
  },
  sectionTitle: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 16,
  },
  vendaCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  vendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendaInfo: {
    flex: 1,
  },
  vendaValor: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 18,
  },
  vendaServico: {
    color: COLORS.zinc400,
    fontSize: 14,
  },
  iconCircle: {
    backgroundColor: COLORS.gold,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: COLORS.zinc400,
    fontSize: 14,
  },
  produtosSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
  },
  produtosLabel: {
    color: COLORS.zinc400,
    fontSize: 12,
    marginBottom: 8,
  },
  produtoItem: {
    color: COLORS.zinc300,
    fontSize: 14,
  },
});
