import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { supabase } from '../../../services/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MessageCircle, Clock, Trash2 } from 'lucide-react-native';
import { format, startOfDay, endOfDay, addDays, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COLORS } from '../../../styles/colors';
import { NovoAgendamentoModal } from '../components/NovoAgendamentoModal';
import { useDeleteAgendamento } from '../hooks/useAgendamento';
import type { Agendamento } from '../../../types';
import { useAlert } from '../../../app/providers/AlertProvider';

const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHora, setSelectedHora] = useState<string | null>(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const queryClient = useQueryClient();
  const { mutate: excluirAgendamento } = useDeleteAgendamento();
  const { showAlert, showConfirm } = useAlert();

  const { data: agendamentos = [], isLoading } = useQuery<Agendamento[]>({
    queryKey: ['agendamentos', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startOfDayDate = startOfDay(selectedDate).toISOString();
      const endOfDayDate = endOfDay(selectedDate).toISOString();
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data_hora', startOfDayDate)
        .lte('data_hora', endOfDayDate)
        .order('data_hora', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  const confirmarWhatsApp = async (agendamento: any) => {
    try {
      const msg = encodeURIComponent(
        `Fala ${agendamento.cliente_nome}! Confirmado seu ${agendamento.servico.toLowerCase()} hoje às ${format(parseISO(agendamento.data_hora), 'HH:mm')}? Te espero aqui! ✂️`
      );
      const phone = agendamento.cliente_telefone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/55${phone}?text=${msg}`);
      
      // Atualizar status
      await (supabase.from('agendamentos') as any)
        .update({ 
          confirmado_whatsapp: true, 
          status: 'confirmado'
        })
        .eq('id', agendamento.id);

      // Criar lembrete automático (1 dia antes)
      const dataLembrete = addDays(parseISO(agendamento.data_hora), -1);
      await (supabase.from('lembretes') as any)
        .insert({
          agendamento_id: agendamento.id,
          cliente_nome: agendamento.cliente_nome,
          mensagem: `Confirmação: ${agendamento.servico} às ${format(parseISO(agendamento.data_hora), 'HH:mm')}`,
          data_envio: dataLembrete.toISOString(),
          status: 'pendente'
        });

      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lembretes'] });
    } catch (error) {
      console.error('Erro ao confirmar:', error);
    }
  };

  const agendamentosPorHora = useMemo(() => {
    return agendamentos.reduce<Record<string, any[]>>((acc, agendamento) => {
      const hora = format(parseISO(agendamento.data_hora), 'HH:mm');

      if (!acc[hora]) {
        acc[hora] = [];
      }

      acc[hora].push(agendamento);
      return acc;
    }, {});
  }, [agendamentos]);

  const agendamentosForaDaEscala = useMemo(() => {
    return agendamentos.filter((agendamento: any) => {
      const hora = format(parseISO(agendamento.data_hora), 'HH:mm');
      return !HORARIOS.includes(hora);
    });
  }, [agendamentos]);

  const proximosDias = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(new Date(), i));

  const abrirNovoAgendamento = (hora?: string | null) => {
    setSelectedAgendamento(null);
    setSelectedHora(hora || null);
    setModalVisible(true);
  };

  const abrirEdicaoAgendamento = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento);
    setSelectedHora(null);
    setModalVisible(true);
  };

  const handleExcluirAgendamento = (agendamento: Agendamento) => {
    showConfirm(
      'Excluir agendamento',
      `Deseja excluir o agendamento de ${agendamento.cliente_nome} às ${format(parseISO(agendamento.data_hora), 'HH:mm')}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            excluirAgendamento(agendamento.id, {
              onError: (error) => {
                console.error('Erro ao excluir agendamento:', error);
                showAlert('Erro', 'Não foi possível excluir o agendamento.', 'error');
              }
            });
          }
        }
      ]
    );
  };

  const renderAgendamentoCard = (agendamento: Agendamento, horaExibida?: string) => (
    <TouchableOpacity
      key={agendamento.id}
      style={styles.agendamentoCard}
      activeOpacity={0.9}
      onPress={() => abrirEdicaoAgendamento(agendamento)}
    >
      <View style={styles.agendamentoHeader}>
        <View style={styles.agendamentoInfo}>
          <Text style={styles.clienteNome}>{agendamento.cliente_nome}</Text>
          <Text style={styles.servico}>{agendamento.servico}</Text>
        </View>
        <View style={styles.horaTag}>
          <Text style={styles.horaText}>
            {horaExibida || format(parseISO(agendamento.data_hora), 'HH:mm')}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <View style={styles.primaryActionContainer}>
          {!agendamento.confirmado_whatsapp && (
            <TouchableOpacity
              onPress={() => confirmarWhatsApp(agendamento)}
              style={styles.whatsappButton}
            >
              <MessageCircle color="#fff" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.whatsappButtonText}>Confirmar WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleExcluirAgendamento(agendamento)}
          style={styles.deleteButton}
        >
          <Trash2 color="#fff" size={18} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.title}>Agenda</Text>
            <Text style={styles.subtitle}>Seus atendimentos</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => abrirNovoAgendamento()}
          >
            <Plus color={COLORS.background} size={24} />
          </TouchableOpacity>
        </View>

      <View style={styles.daysContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {proximosDias.map(dia => {
            const isSelected = isSameDay(dia, selectedDate);
            return (
              <TouchableOpacity
                key={dia.toString()}
                onPress={() => setSelectedDate(dia)}
                style={[styles.dayButton, isSelected && styles.dayButtonActive]}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                  {format(dia, 'EEE', { locale: ptBR })}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                  {format(dia, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {agendamentosForaDaEscala.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horários fora da escala</Text>
            <Text style={styles.sectionSubtitle}>
              Agendamentos criados fora dos horários fixos da agenda.
            </Text>

            {agendamentosForaDaEscala.map((agendamento: any) => (
              <View key={agendamento.id} style={styles.horarioItem}>
                {renderAgendamentoCard(agendamento)}
              </View>
            ))}
          </View>
        )}

        {HORARIOS.map(hora => {
          const agendamentosNoHorario = agendamentosPorHora[hora] || [];
          
          return (
            <View key={hora} style={styles.horarioItem}>
              {agendamentosNoHorario.length > 0 ? (
                agendamentosNoHorario.map((agendamento: any) => (
                  <View key={agendamento.id} style={styles.slotCardSpacing}>
                    {renderAgendamentoCard(agendamento, hora)}
                  </View>
                ))
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    abrirNovoAgendamento(hora);
                  }}
                  style={styles.disponivelCard}
                >
                  <Clock color={COLORS.zinc500} size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.disponivelHora}>{hora}</Text>
                  <Text style={styles.disponivelText}>Clique para agendar</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>

    <NovoAgendamentoModal 
      visible={modalVisible}
      selectedDate={selectedDate}
      selectedHora={selectedHora}
      agendamento={selectedAgendamento}
      onClose={() => {
        setModalVisible(false);
        setSelectedHora(null);
        setSelectedAgendamento(null);
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
  daysContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  dayButton: {
    width: 70,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.zinc700,
  },
  dayButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: COLORS.zinc400,
  },
  dayTextActive: {
    color: COLORS.background,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
    color: COLORS.zinc400,
  },
  dayNumberActive: {
    color: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.zinc400,
    marginBottom: 12,
  },
  horarioItem: {
    marginBottom: 12,
  },
  slotCardSpacing: {
    marginBottom: 8,
  },
  agendamentoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  primaryActionContainer: {
    flex: 1,
  },
  agendamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  horaTag: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  horaText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 14,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
  },
  whatsappButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    height: 44,
    width: 44,
    borderRadius: 8,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  disponivelCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.zinc700,
  },
  disponivelHora: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.zinc400,
    marginLeft: 8,
    marginRight: 12,
  },
  disponivelText: {
    fontSize: 14,
    color: COLORS.zinc500,
  },
});
