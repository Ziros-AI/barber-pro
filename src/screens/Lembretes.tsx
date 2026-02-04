import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, Clock, Send, Plus } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COLORS } from '../styles/colors';

export default function LembretesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
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

  const pendentes = lembretes.filter((l: any) => l.status === 'pendente');
  const enviados = lembretes.filter((l: any) => l.status === 'enviado');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const renderLembrete = (lembrete: any) => {
    const isPendente = lembrete.status === 'pendente';
    
    return (
      <View 
        key={lembrete.id} 
        style={[
          styles.lembreteCard,
          isPendente ? styles.lembreteCardPendente : styles.lembreteCardEnviado
        ]}
      >
        <View style={styles.lembreteHeader}>
          <View style={styles.lembreteInfo}>
            <View style={styles.statusRow}>
              {isPendente ? (
                <Clock color="#ca8a04" size={20} style={{ marginRight: 8 }} />
              ) : (
                <Check color="#22c55e" size={20} style={{ marginRight: 8 }} />
              )}
              <Text style={[
                styles.statusText,
                isPendente ? styles.statusPendente : styles.statusEnviado
              ]}>
                {isPendente ? 'PENDENTE' : 'ENVIADO'}
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
              {pendentes.length} pendentes • {enviados.length} enviados
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
        {pendentes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pendentes</Text>
            {pendentes.map(renderLembrete)}
          </>
        )}

        {enviados.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Enviados</Text>
            {enviados.map(renderLembrete)}
          </>
        )}

        {lembretes.length === 0 && (
          <View style={styles.emptyState}>
            <Bell color={COLORS.zinc500} size={48} />
            <Text style={styles.emptyText}>
              Nenhum lembrete configurado
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  sectionTitle: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12,
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
});
