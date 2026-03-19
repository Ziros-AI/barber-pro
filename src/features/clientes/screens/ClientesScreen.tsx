import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, TextInput, Linking } from 'react-native';
import { supabase } from '../../../services/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { User, Phone, Calendar, Plus, AlertCircle, MessageCircle, Search } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { differenceInDays, parseISO } from 'date-fns';
import { NovoClienteModal } from '../components/NovoClienteModal';
import { ClienteDetalhesModal } from '../components/ClienteDetalhesModal';

export default function ClientesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<any | null>(null);
  const [detalhesVisible, setDetalhesVisible] = useState(false);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calcular radar de retorno para cada cliente
  const clientesComRadar = (clientes as any[]).map((cliente: any) => {
    // Encontrar último agendamento concluído
    const ultimoAgendamento = (agendamentos as any[])
      .filter((a: any) => a.cliente_nome === cliente.nome && a.status === 'concluido')
      .sort((a: any, b: any) => new Date(b.data_hora as string).getTime() - new Date(a.data_hora as string).getTime())[0];

    let diasDesdeUltimoCorte: number | null = null;
    let precisaRetornar = false;
    let urgente = false;

    if (ultimoAgendamento) {
      diasDesdeUltimoCorte = differenceInDays(new Date(), parseISO(ultimoAgendamento.data_hora as string));
      const frequencia = cliente.frequencia_dias || 30;
      
      // Aviso de retorno se passou 80% do período de frequência
      precisaRetornar = diasDesdeUltimoCorte >= (frequencia * 0.8);
      // Urgente se passou 100% do período
      urgente = diasDesdeUltimoCorte >= frequencia;
    }

    return {
      ...cliente,
      diasDesdeUltimoCorte,
      precisaRetornar,
      urgente,
      ultimaVisita: ultimoAgendamento?.data_hora as string | undefined
    };
  });

  // Separar clientes que precisam retornar dos outros
  const clientesFiltrados = clientesComRadar.filter((c: any) =>
    c.nome.toLowerCase().includes(searchText.toLowerCase()) ||
    c.telefone?.includes(searchText)
  );

  const clientesUrgentes = clientesFiltrados.filter((c: any) => c.urgente);
  const clientesPrecisam = clientesFiltrados.filter((c: any) => c.precisaRetornar && !c.urgente);
  const outrosClientes = clientesFiltrados.filter((c: any) => !c.precisaRetornar && !c.urgente);

  const enviarConvite = (cliente: any) => {
    const msg = encodeURIComponent(
      `E aí ${cliente.nome}! 💈 Tá na hora de dar um trato no visual! Tá cheio aqui mas sempre tenho um horário pra você. Bora marcar? ✂️`
    );
    const phone = cliente.telefone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${phone}?text=${msg}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const abrirDetalhesCliente = (cliente: any) => {
    setClienteSelecionado(cliente);
    setDetalhesVisible(true);
  };

  const renderClienteCard = (cliente: any) => (
    <TouchableOpacity
      key={cliente.id}
      activeOpacity={0.9}
      onPress={() => abrirDetalhesCliente(cliente)}
      style={[
      styles.clienteCard,
      cliente.urgente && { borderLeftColor: '#ef4444', borderLeftWidth: 4 },
      cliente.precisaRetornar && !cliente.urgente && { borderLeftColor: COLORS.orange, borderLeftWidth: 4 }
    ]}
    >
      <View style={styles.clienteHeader}>
        <View style={[
          styles.avatar,
          cliente.urgente && { backgroundColor: '#fee2e2' },
          cliente.precisaRetornar && !cliente.urgente && { backgroundColor: `${COLORS.orange}20` }
        ]}>
          <User color={COLORS.background} size={24} />
        </View>
        <View style={styles.clienteInfo}>
          <Text style={styles.clienteNome}>{cliente.nome}</Text>
          <Text style={styles.clienteEmail}>{cliente.email}</Text>
        </View>
        {cliente.urgente && (
          <AlertCircle color="#ef4444" size={20} />
        )}
      </View>
      
      {cliente.telefone && (
        <View style={styles.infoRow}>
          <Phone color={COLORS.zinc500} size={16} style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>{cliente.telefone}</Text>
        </View>
      )}
      
      <View style={styles.infoRow}>
        <Calendar color={COLORS.zinc500} size={16} style={{ marginRight: 8 }} />
        <Text style={styles.infoTextSecondary}>
          {cliente.diasDesdeUltimoCorte !== null 
            ? `Última visita: ${cliente.diasDesdeUltimoCorte} dias` 
            : 'Primeira visita'}
        </Text>
      </View>

      {(cliente.precisaRetornar || cliente.urgente) && (
        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            enviarConvite(cliente);
          }}
          style={[
            styles.convideButtom,
            cliente.urgente && { backgroundColor: '#ef4444' }
          ]}
        >
          <MessageCircle color="white" size={16} />
          <Text style={styles.convideText}>
            {cliente.urgente ? 'Chamar urgente' : 'Enviar convite'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Clientes</Text>
            <Text style={styles.subtitle}>Radar de retorno ativo</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus color={COLORS.background} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search color={COLORS.zinc500} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou telefone..."
            placeholderTextColor={COLORS.zinc500}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {clientesUrgentes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔴 Retorno Urgente ({clientesUrgentes.length})</Text>
            <View style={styles.content}>
              {clientesUrgentes.map(renderClienteCard)}
            </View>
          </View>
        )}

        {clientesPrecisam.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🟡 Próximo de Retornar ({clientesPrecisam.length})</Text>
            <View style={styles.content}>
              {clientesPrecisam.map(renderClienteCard)}
            </View>
          </View>
        )}

        {outrosClientes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Ativos ({outrosClientes.length})</Text>
            <View style={styles.content}>
              {outrosClientes.map(renderClienteCard)}
            </View>
          </View>
        )}
      </ScrollView>

      <NovoClienteModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />

      <ClienteDetalhesModal
        visible={detalhesVisible}
        cliente={clienteSelecionado}
        onClose={() => {
          setDetalhesVisible(false);
          setClienteSelecionado(null);
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    color: COLORS.foreground,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  clienteCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  clienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: COLORS.gold,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  clienteEmail: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: COLORS.zinc300,
  },
  infoTextSecondary: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  convideButtom: {
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  convideText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 14,
  },
});
