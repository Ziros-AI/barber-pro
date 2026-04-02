import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Scissors, Clock, DollarSign } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { supabase } from '../../../services/api/supabaseClient';
import { NovoServicoModal } from '../components/NovoServicoModal';
import { ServicoDetalhesModal } from '../components/ServicoDetalhesModal';

export default function ServicosScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [servicoSelecionado, setServicoSelecionado] = useState<any | null>(null);

  const { data: servicos = [], isLoading } = useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const servicosFiltrados = (servicos as any[]).filter((s) =>
    s.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const renderServicoCard = (servico: any) => (
    <TouchableOpacity
      key={servico.id}
      style={styles.card}
      onPress={() => setServicoSelecionado(servico)} // seleciona o serviço e abre modal
    >
      <View style={styles.headerCard}>
        <View style={styles.icon}>
          <Scissors color={COLORS.background} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{servico.nome}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <DollarSign size={16} color={COLORS.zinc500} />
        <Text style={styles.infoText}>
          R$ {Number(servico.preco).toFixed(2)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Clock size={16} color={COLORS.zinc500} />
        <Text style={styles.infoText}>
          {servico.duracao} min
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Serviços</Text>
            <Text style={styles.subtitle}>Gerencie seus serviços</Text>
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
            placeholder="Buscar serviço..."
            placeholderTextColor={COLORS.zinc500}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.content}>
          {servicosFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum serviço encontrado
            </Text>
          ) : (
            servicosFiltrados.map(renderServicoCard)
          )}
        </View>
      </ScrollView>

      <NovoServicoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      <ServicoDetalhesModal
        visible={!!servicoSelecionado}
        servico={servicoSelecionado}
        onClose={() => setServicoSelecionado(null)}
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
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc400,
  },
  addButton: {
    backgroundColor: COLORS.gold,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    color: COLORS.white,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    backgroundColor: COLORS.gold,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nome: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    color: COLORS.zinc300,
  },
  emptyText: {
    color: COLORS.zinc500,
    textAlign: 'center',
    marginTop: 40,
  },
});
