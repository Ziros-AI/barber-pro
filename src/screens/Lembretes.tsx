import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Clock, Send, Plus } from 'lucide-react-native';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COLORS } from '../styles/colors';
import { NovoLembreteModal } from '../components/modals/NovoLembreteModal';

export default function LembretesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: lembretes = [], isLoading } = useQuery({
    queryKey: ['lembretes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lembretes')
        .select('*')
        .order('data_envio', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const marcarComoEnviado = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('lembretes' as any)
        .update({ status: 'enviado' } as any as never)
        .eq('id', id) as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembretes'] });
    }
  });

  const enviarWhatsApp = (lembrete: any) => {
    const telefone = lembrete.cliente_telefone?.replace(/\D/g, '') || '';
    const mensagem = encodeURIComponent(lembrete.mensagem || 'Lembrete de agendamento');
    
    if (!telefone) {
      Alert.alert('Erro', 'Telefone não encontrado');
      return;
    }

    const url = `https://wa.me/55${telefone}?text=${mensagem}`;
    
    Linking.openURL(url).then(() => {
      marcarComoEnviado.mutate(lembrete.id);
    }).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
    });
  };

  const pendentes = lembretes.filter((l: any) => l.status === 'pendente');
  const prontos = pendentes.filter((l: any) => isPast(parseISO(l.data_envio)));
  const agendados = pendentes.filter((l: any) => !isPast(parseISO(l.data_envio)));
  const enviados = lembretes.filter((l: any) => l.status === 'enviado');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const renderLembrete = (lembrete: any, showButton: boolean = false) => {
    const isPendente = lembrete.status === 'pendente';
    const isPronto = isPendente && isPast(parseISO(lembrete.data_envio));
    
    return (
      <View 
        key={lembrete.id} 
        style={[
          styles.lembreteCard,
          isPronto ? styles.lembreteCardPronto : 
          isPendente ? styles.lembreteCardPendente : styles.lembreteCardEnviado
        ]}
      >
        <View style={styles.lembreteHeader}>
          <View style={styles.lembreteInfo}>
            <View style={styles.statusRow}>
              {isPronto ? (
                <Bell color="#f59e0b" size={20} style={{ marginRight: 8 }} />
              ) : isPendente ? (
                <Clock color="#ca8a04" size={20} style={{ marginRight: 8 }} />
              ) : (
                <Check color="#22c55e" size={20} style={{ marginRight: 8 }} />
              )}
              <Text style={[
                styles.statusText,
                isPronto ? styles.statusPronto :
                isPendente ? styles.statusPendente : styles.statusEnviado
              ]}>
                {isPronto ? 'PRONTO' : isPendente ? 'AGENDADO' : 'ENVIADO'}
              </Text>
            </View>
            <Text style={styles.clienteNome}>
              {lembrete.cliente_nome || 'Cliente'}
            </Text>
            <Text style={styles.mensagem} numberOfLines={3}>
              {lembrete.mensagem}
            </Text>
          </View>
          <View style={styles.iconCircle}>
            <Bell color={COLORS.background} size={20} />
          </View>
        </View>
        
        <View style={styles.dateRow}>
          <Send color={COLORS.zinc500} size={14} style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>
            {isPendente ? 'Envio programado para ' : 'Enviado em '}
            {format(parseISO(lembrete.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </View>

        {showButton && isPronto && (
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => enviarWhatsApp(lembrete)}
          >
            <Send color={COLORS.white} size={16} />
            <Text style={styles.whatsappButtonText}>Enviar WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Lembretes</Text>
            <Text style={styles.subtitle}>
              {prontos.length} prontos • {agendados.length} agendados • {enviados.length} enviados
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus color={COLORS.background} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {prontos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Bell color="#f59e0b" size={20} />
                <Text style={styles.sectionTitle}>Prontos para Enviar</Text>
              </View>
              {prontos.map(l => renderLembrete(l, true))}
            </View>
          )}

          {agendados.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock color={COLORS.zinc400} size={20} />
                <Text style={styles.sectionTitle}>Agendados</Text>
              </View>
              {agendados.map(l => renderLembrete(l, false))}
            </View>
          )}

          {enviados.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Check color="#22c55e" size={20} />
                <Text style={styles.sectionTitle}>Enviados</Text>
              </View>
              {enviados.slice(0, 10).map(l => renderLembrete(l, false))}
            </View>
          )}

          {lembretes.length === 0 && (
            <View style={styles.emptyState}>
              <Bell color={COLORS.zinc700} size={64} />
              <Text style={styles.emptyText}>Nenhum lembrete ainda</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <NovoLembreteModal
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
  header: {
    backgroundColor: COLORS.cardBg,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addButton: {
    backgroundColor: COLORS.gold,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 18,
  },
  lembreteCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  lembreteCardPendente: {
    backgroundColor: 'rgba(113, 63, 18, 0.2)',
    borderWidth: 2,
    borderColor: '#ca8a04',
  },
  lembreteCardPronto: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  lembreteCardEnviado: {
    backgroundColor: COLORS.cardBg,
  },
  lembreteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lembreteInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 14,
  },
  statusPendente: {
    color: '#ca8a04',
  },
  statusPronto: {
    color: '#f59e0b',
  },
  statusEnviado: {
    color: '#22c55e',
  },
  clienteNome: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  mensagem: {
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
    marginLeft: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
  },
  dateText: {
    color: COLORS.zinc400,
    fontSize: 14,
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
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  whatsappButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});
