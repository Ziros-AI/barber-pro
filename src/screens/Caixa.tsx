import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Check, CheckCircle2 } from 'lucide-react-native';
import { startOfDay, endOfDay, format } from 'date-fns';
import { COLORS } from '../styles/colors';
import { FinalizarVendaModal } from '../components/modals/FinalizarVendaModal';

export default function CaixaScreen() {
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<any>(null);

  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useQuery({
    queryKey: ['agendamentos-hoje-confirmados'],
    queryFn: async () => {
      const agora = new Date();
      const inicioDoDia = startOfDay(agora).toISOString();
      const horarioAtual = agora.toISOString();

      const { error: errorAtualizacao } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmado' })
        .gte('data_hora', inicioDoDia)
        .lte('data_hora', horarioAtual)
        .eq('status', 'pendente');

      if (errorAtualizacao) throw errorAtualizacao;

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data_hora', inicioDoDia)
        .lte('data_hora', horarioAtual)
        .eq('status', 'confirmado')
        .order('data_hora', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000
  });

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
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

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas-hoje'],
    queryFn: async () => {
      const hoje = new Date();

      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .gte('created_at', startOfDay(hoje).toISOString())
        .lte('created_at', endOfDay(hoje).toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const totalVendas = vendas.reduce((acc, venda: any) => acc + (venda.valor_total || 0), 0);

  const isLoading = loadingAgendamentos || loadingProdutos || loadingVendas;

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
        <Text style={styles.title}>Caixa</Text>
        <Text style={styles.subtitle}>Finalize os atendimentos de hoje ate o horario atual</Text>
      </View>

      <View style={styles.content}>
        {totalVendas > 0 && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total de Vendas Hoje</Text>
            <Text style={styles.totalValue}>R$ {totalVendas.toFixed(2)}</Text>
          </View>
        )}

        {agendamentos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pendentes de Finalização</Text>
            {agendamentos.map((agendamento: any) => (
              <View key={agendamento.id} style={styles.agendamentoCard}>
                <View style={styles.agendamentoHeader}>
                  <View style={styles.agendamentoInfo}>
                    <Text style={styles.clienteNome}>{agendamento.cliente_nome}</Text>
                    <Text style={styles.servico}>{agendamento.servico}</Text>
                    <Text style={styles.valor}>
                      R$ {(agendamento.valor || 50).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.iconCircleGreen}>
                    <Check color={COLORS.white} size={20} />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.finalizarButton}
                  onPress={() => setAtendimentoSelecionado(agendamento)}
                >
                  <Text style={styles.finalizarButtonText}>Finalizar Atendimento</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {vendas.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Histórico de Hoje</Text>
            {vendas.map((venda: any) => (
              <View key={venda.id} style={styles.vendaCard}>
                <View style={styles.vendaHeader}>
                  <View style={styles.vendaInfo}>
                    <Text style={styles.vendaValor}>R$ {venda.valor_total.toFixed(2)}</Text>
                    <Text style={styles.vendaServico}>
                      Serviço: R$ {venda.valor_servico.toFixed(2)}
                    </Text>
                    {venda.produtos_vendidos?.length > 0 && (
                      <Text style={styles.vendaServico}>
                        {venda.produtos_vendidos.length} produto(s)
                      </Text>
                    )}
                    <Text style={styles.dateText}>
                      {format(new Date(venda.created_at), 'HH:mm')}
                    </Text>
                  </View>
                  <View style={styles.iconCircle}>
                    <CheckCircle2 color={COLORS.background} size={20} />
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {agendamentos.length === 0 && vendas.length === 0 && (
          <View style={styles.emptyState}>
            <DollarSign color={COLORS.zinc700} size={64} />
            <Text style={styles.emptyText}>Nenhuma atividade no caixa hoje</Text>
          </View>
        )}
      </View>
    </ScrollView>

    {atendimentoSelecionado && (
      <FinalizarVendaModal
        visible={!!atendimentoSelecionado}
        onClose={() => setAtendimentoSelecionado(null)}
        agendamento={atendimentoSelecionado}
        produtos={produtos}
      />
    )}
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.zinc500,
    marginTop: 16,
  },
  agendamentoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.zinc800,
  },
  agendamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  agendamentoInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  servico: {
    fontSize: 14,
    color: COLORS.zinc400,
    marginBottom: 8,
  },
  valor: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gold,
  },
  iconCircleGreen: {
    backgroundColor: '#16a34a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalizarButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  finalizarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
});
