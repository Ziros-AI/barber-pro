import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, ShoppingBag, Users, AlertCircle, Clock, Zap } from 'lucide-react-native';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO, differenceInDays } from 'date-fns';
import { COLORS } from '../styles/colors';

export default function DashboardScreen() {
  const [periodo, setPeriodo] = useState('hoje');
  
  const getDateRange = () => {
    const now = new Date();
    switch (periodo) {
      case 'hoje':
        return { inicio: startOfDay(now), fim: endOfDay(now) };
      case 'mes':
        return { inicio: startOfMonth(now), fim: endOfMonth(now) };
      default:
        return { inicio: startOfDay(now), fim: endOfDay(now) };
    }
  };

  const { inicio, fim } = getDateRange();

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString());
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos-prox'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data_hora', now)
        .order('data_hora', { ascending: true })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

  const totalFaturamento = vendas.reduce((sum: number, v: any) => sum + v.valor_total, 0);
  const totalServicos = vendas.reduce((sum: number, v: any) => sum + v.valor_servico, 0);
  const ticketMedio = vendas.length > 0 ? totalFaturamento / vendas.length : 0;
  const qtdAtendimentos = vendas.length;

  // Calcular produtos com estoque baixo
  const produtosEstoqueBaixo = produtos.filter((p: any) => p.estoque <= 5).length;

  // Calcular clientes que precisam retornar
  const clientesRetorno = clientes.filter((c: any) => {
    // Aqui você poderia calcular se precisa retornar
    // Por enquanto, só conta como exemplo
    return c.frequencia_dias;
  }).length;

  const isLoading = loadingVendas;

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
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Seus números</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.filterRow}>
          {['hoje', 'mes'].map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriodo(p)}
              style={[
                styles.filterButton,
                periodo === p ? styles.filterButtonActive : styles.filterButtonInactive
              ]}
            >
              <Text style={[
                styles.filterText,
                periodo === p ? styles.filterTextActive : styles.filterTextInactive
              ]}>
                {p === 'hoje' ? 'Hoje' : 'Este Mês'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.cardGreen]}>
            <DollarSign color="#fff" size={32} style={{ opacity: 0.8, marginBottom: 8 }} />
            <Text style={styles.cardLabel}>Faturamento</Text>
            <Text style={styles.cardValue}>
              R$ {totalFaturamento.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.card, styles.cardGold]}>
            <TrendingUp color="#09090b" size={32} style={{ opacity: 0.8, marginBottom: 8 }} />
            <Text style={styles.cardLabelDark}>Ticket Médio</Text>
            <Text style={styles.cardValueDark}>
              R$ {ticketMedio.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.card, styles.cardBlue]}>
            <ShoppingBag color="#fff" size={32} style={{ opacity: 0.8, marginBottom: 8 }} />
            <Text style={styles.cardLabel}>Serviços</Text>
            <Text style={styles.cardValue}>
              R$ {totalServicos.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.card, styles.cardPurple]}>
            <Users color="#fff" size={32} style={{ opacity: 0.8, marginBottom: 8 }} />
            <Text style={styles.cardLabel}>Atendimentos</Text>
            <Text style={styles.cardValue}>
              {qtdAtendimentos}
            </Text>
          </View>

          <View style={[styles.card, styles.cardOrange]}>
            <AlertCircle color="#fff" size={32} style={{ opacity: 0.8, marginBottom: 8 }} />
            <Text style={styles.cardLabel}>Estoque Baixo</Text>
            <Text style={styles.cardValue}>
              {produtosEstoqueBaixo}
            </Text>
          </View>

          <View style={[styles.card, styles.cardCyan]}>
            <Clock color="#fff" size={32} style={{ opacity: 0.8, marginBottom: 8 }} />
            <Text style={styles.cardLabel}>Próximos</Text>
            <Text style={styles.cardValue}>
              {agendamentos.length}
            </Text>
          </View>
        </View>

        {agendamentos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Próximos Agendamentos</Text>
            {agendamentos.slice(0, 3).map((agenda: any) => (
              <View key={agenda.id} style={styles.agendaItem}>
                <View style={styles.agendaItemLeft}>
                  <Text style={styles.agendaItemTime}>
                    {new Date(agenda.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <View>
                    <Text style={styles.agendaItemClient}>{agenda.cliente_nome}</Text>
                    <Text style={styles.agendaItemService}>{agenda.servico}</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  agenda.status === 'confirmado' && styles.statusConfirmado
                ]}>
                  <Text style={styles.statusText}>
                    {agenda.status === 'confirmado' ? '✓' : '○'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterButtonActive: {
    backgroundColor: COLORS.gold,
  },
  filterButtonInactive: {
    backgroundColor: COLORS.cardBg,
  },
  filterText: {
    fontWeight: '700',
  },
  filterTextActive: {
    color: COLORS.background,
  },
  filterTextInactive: {
    color: COLORS.zinc400,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    minWidth: '47%',
    flex: 1,
  },
  cardGreen: {
    backgroundColor: COLORS.green,
  },
  cardGold: {
    backgroundColor: COLORS.gold,
  },
  cardBlue: {
    backgroundColor: COLORS.blue,
  },
  cardPurple: {
    backgroundColor: COLORS.purple,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  cardLabelDark: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  cardValueDark: {
    fontSize: 24,
    fontWeight: '900',
    color: '#09090b',
  },
  cardOrange: {
    backgroundColor: COLORS.orange,
  },
  cardCyan: {
    backgroundColor: '#06b6d4',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
    marginBottom: 12,
  },
  agendaItem: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  agendaItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agendaItemTime: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
    marginRight: 12,
    minWidth: 50,
  },
  agendaItemClient: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  agendaItemService: {
    fontSize: 12,
    color: COLORS.zinc400,
    marginTop: 2,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.zinc700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusConfirmado: {
    backgroundColor: '#22c55e',
  },
  statusText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
