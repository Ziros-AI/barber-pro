import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { endOfDay, format, startOfDay } from 'date-fns';
import { Check, CheckCircle2, DollarSign } from 'lucide-react-native';
import { supabase } from '../../../services/api/supabaseClient';
import { FinalizarVendaModal } from '../components/FinalizarVendaModal';
import { VendaDetalhesModal } from '../components/VendaDetalhesModal';
import { COLORS } from '../../../styles/colors';

interface ProdutoVendido {
  nome?: string;
  quantidade?: number;
  subtotal?: number;
}

interface VendaHistorico {
  id: string;
  created_at: string;
  valor_total: number;
  valor_servico: number;
  servico_id?: string | null;
  forma_pagamento?: string | null;
  produtos_vendidos?: ProdutoVendido[] | null;
  servicos?: {
    nome?: string | null;
    preco?: number | null;
  } | null;
  cliente?: {
    nome?: string | null;
  } | null;
}

export default function CaixaScreen() {
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<any>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaHistorico | null>(null);
  const { data: servicos = [] } = useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, preco, duracao');

      if (error) throw error;
      return data || [];
    },
  });

  const servicosMap = new Map(servicos.map((servico) => [servico.id, servico]));

  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useQuery({
    queryKey: ['agendamentos-hoje-confirmados'],
    queryFn: async () => {
      const agora = new Date();
      const inicioDoDia = startOfDay(agora).toISOString();
      const horarioAtual = agora.toISOString();

      const { error: errorAtualizacao } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmado' } as never)
        .gte('data_hora', inicioDoDia)
        .lte('data_hora', horarioAtual)
        .eq('status', 'pendente');

      if (errorAtualizacao) throw errorAtualizacao;

      const { data, error } = await (supabase
        .from('agendamentos')
        .select('*')
        .gte('data_hora', inicioDoDia)
        .lte('data_hora', horarioAtual)
        .eq('status', 'confirmado')
        .order('data_hora', { ascending: true }) as any);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos').select('*').order('nome', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas-hoje'],
    queryFn: async () => {
      const hoje = new Date();

      const { data, error } = await (supabase
        .from('vendas')
        .select(
          `
            id,
            created_at,
            valor_total,
            valor_servico,
            servico_id,
            forma_pagamento,
            produtos_vendidos,
            cliente:clientes(nome)
          `
        )
        .gte('created_at', startOfDay(hoje).toISOString())
        .lte('created_at', endOfDay(hoje).toISOString())
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as VendaHistorico[];
    },
  });

  const totalVendas = vendas.reduce((acc, venda) => acc + (venda.valor_total || 0), 0);
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
              <Text style={styles.sectionTitle}>Pendentes de Finalizacao</Text>
              {agendamentos.map((agendamento: any) => (
                <View key={agendamento.id} style={styles.agendamentoCard}>
                  <View style={styles.agendamentoHeader}>
                    <View style={styles.agendamentoInfo}>
                      <Text style={styles.clienteNome}>{agendamento.cliente_nome}</Text>
                      <Text style={styles.servico}>{servicosMap.get(agendamento.servico_id)?.nome || agendamento.servico || 'Servico nao informado'}</Text>
                      <Text style={styles.valor}>R$ {Number(servicosMap.get(agendamento.servico_id)?.preco || agendamento.valor || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.iconCircleGreen}>
                      <Check color={COLORS.white} size={20} />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.finalizarButton}
                    onPress={() =>
                      setAtendimentoSelecionado({
                        ...agendamento,
                        servicos: servicosMap.get(agendamento.servico_id) || null
                      })
                    }
                  >
                    <Text style={styles.finalizarButtonText}>Finalizar Atendimento</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {vendas.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Historico de Hoje</Text>
              {vendas.map((venda) => (
                <TouchableOpacity
                  key={venda.id}
                  style={styles.vendaCard}
                  activeOpacity={0.85}
                  onPress={() => setVendaSelecionada(venda)}
                >
                  <View style={styles.vendaHeader}>
                    <View style={styles.vendaInfo}>
                      <Text style={styles.vendaValor}>R$ {venda.valor_total.toFixed(2)}</Text>
                      <Text style={styles.vendaCliente}>{venda.cliente?.nome?.trim() || 'Cliente nao informado'}</Text>
                      <Text style={styles.vendaServico}>
                        Serviço: {servicosMap.get(venda.servico_id || '')?.nome || 'Nao informado'} • R$ {venda.valor_servico.toFixed(2)}
                      </Text>
                      {venda.produtos_vendidos?.length ? (
                        <Text style={styles.vendaServico}>{venda.produtos_vendidos.length} produto(s)</Text>
                      ) : null}
                      <Text style={styles.dateText}>{format(new Date(venda.created_at), 'HH:mm')}</Text>
                    </View>
                    <View style={styles.iconCircle}>
                      <CheckCircle2 color={COLORS.background} size={20} />
                    </View>
                  </View>
                  <Text style={styles.vendaHint}>Toque para ver os detalhes</Text>
                </TouchableOpacity>
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

      <VendaDetalhesModal visible={!!vendaSelecionada} onClose={() => setVendaSelecionada(null)} venda={vendaSelecionada} />
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
  vendaCliente: {
    color: COLORS.zinc300,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  vendaServico: {
    color: COLORS.zinc400,
    fontSize: 14,
  },
  vendaHint: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  iconCircle: {
    backgroundColor: COLORS.gold,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    color: COLORS.zinc400,
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
