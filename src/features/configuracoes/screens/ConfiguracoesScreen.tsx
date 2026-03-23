import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, StyleSheet, Switch } from 'react-native';
import { supabase } from '../../../services/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Scissors } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { useAlert } from '../../../app/providers/AlertProvider';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/providers/AuthProvider';

interface Configuracao {
  id?: string;
  nome_barbearia: string;
  valor_corte?: number;
  valor_barba?: number;
  valor_corte_barba?: number;
  horas_lembrete: number;
  mensagem_lembrete_template: string;
  lembretes_ativos: boolean;
}

const DEFAULT_CONFIG: Configuracao = {
  nome_barbearia: 'Barbearia',
  valor_corte: 50,
  valor_barba: 40,
  valor_corte_barba: 80,
  horas_lembrete: 24,
  mensagem_lembrete_template:
    'Olá {nome}, lembrete do seu {servico} amanhã às {hora}. Te esperamos! - {barbearia}',
  lembretes_ativos: true,
};

export default function ConfiguracoesScreen() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const navigation = useNavigation();
  const { user } = useAuth();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['configuracoes', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('user_id', user!.id)
        .limit(1);

      if (error) throw error;
      return data || [];
    },
  });

  const [novaConfig, setNovaConfig] = useState<Configuracao>(DEFAULT_CONFIG);

  React.useEffect(() => {
    if (configs[0]) {
      setNovaConfig({
        nome_barbearia: configs[0].nome_barbearia || '',
        mensagem_lembrete_template: configs[0].mensagem_lembrete_template || '',
        horas_lembrete: (configs[0] as any).horas_lembrete ?? 24,
        lembretes_ativos: (configs[0] as any).lembretes_ativos ?? true,
        valor_corte: (configs[0] as any).valor_corte ?? 50,
        valor_barba: (configs[0] as any).valor_barba ?? 40,
        valor_corte_barba: (configs[0] as any).valor_corte_barba ?? 80,
      });
      return;
    }

    setNovaConfig(DEFAULT_CONFIG);
  }, [configs]);

  const salvarConfig = useMutation({
    mutationFn: async (data: Configuracao) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado.');
      }

      const payload = {
        ...data,
        user_id: user.id,
      };

      const { data: existingConfigs, error: existingConfigError } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingConfigError) {
        throw existingConfigError;
      }

      const existingConfigId = existingConfigs?.[0]?.id || (configs[0] as any)?.id;

      if (existingConfigId) {
        const { error } = await (supabase
          .from('configuracoes' as any)
          .update(payload as any as never)
          .eq('id', existingConfigId)
          .eq('user_id', user.id) as any);

        if (error) throw error;
        return;
      }

      const { error } = await (supabase
        .from('configuracoes' as any)
        .insert([payload] as any as never) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
      queryClient.invalidateQueries({ queryKey: ['configuracoes', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'agenda', user?.id] });
      showAlert('Sucesso', 'Configurações salvas com sucesso!', 'success');
    },
    onError: (error) => {
      console.log('ERRO COMPLETO:', error);

      showAlert(
        'Erro',
        JSON.stringify(error),
        'error'
      );
    },
  });

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
        <Settings color={COLORS.gold} size={32} />
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Personalize sua barbearia</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciamento</Text>

        <TouchableOpacity
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.zinc700,
          }}
          onPress={() => navigation.navigate('Servicos' as never)}
        >
          <Scissors color={COLORS.gold} size={20} />
          <Text style={{ color: COLORS.white, marginLeft: 12, fontSize: 16 }}>Serviços</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Barbearia</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Barbearia</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Barbearia Premium"
              placeholderTextColor={COLORS.zinc600}
              value={novaConfig.nome_barbearia}
              onChangeText={(text) => setNovaConfig({ ...novaConfig, nome_barbearia: text })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valores e Preços</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor Padrão do Corte (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="50.00"
              placeholderTextColor={COLORS.zinc600}
              value={String(novaConfig.valor_corte || 50)}
              onChangeText={(text) => {
                const valor = parseFloat(text.replace(',', '.')) || 0;
                setNovaConfig({ ...novaConfig, valor_corte: valor });
              }}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor Padrão da Barba (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="40.00"
              placeholderTextColor={COLORS.zinc600}
              value={String(novaConfig.valor_barba || 40)}
              onChangeText={(text) => {
                const valor = parseFloat(text.replace(',', '.')) || 0;
                setNovaConfig({ ...novaConfig, valor_barba: valor });
              }}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor Padrão Corte + Barba (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="80.00"
              placeholderTextColor={COLORS.zinc600}
              value={String(novaConfig.valor_corte_barba || 80)}
              onChangeText={(text) => {
                const valor = parseFloat(text.replace(',', '.')) || 0;
                setNovaConfig({ ...novaConfig, valor_corte_barba: valor });
              }}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>Estes valores serão usados ao criar novos agendamentos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lembretes Automáticos</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Ativar Lembretes</Text>
              <Text style={styles.switchDescription}>
                Criar lembretes automaticamente ao confirmar agendamento
              </Text>
            </View>
            <Switch
              value={novaConfig.lembretes_ativos}
              onValueChange={(value) => setNovaConfig({ ...novaConfig, lembretes_ativos: value })}
              trackColor={{ false: COLORS.zinc700, true: COLORS.gold }}
              thumbColor={novaConfig.lembretes_ativos ? COLORS.white : COLORS.zinc400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enviar lembrete quantas horas antes?</Text>
            <TextInput
              style={styles.input}
              placeholder="24"
              placeholderTextColor={COLORS.zinc600}
              value={String(novaConfig.horas_lembrete)}
              onChangeText={(text) => setNovaConfig({ ...novaConfig, horas_lembrete: parseInt(text, 10) || 24 })}
              keyboardType="number-pad"
            />
            <Text style={styles.hint}>Padrão: 24 horas</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Template da Mensagem</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Digite o template da mensagem..."
              placeholderTextColor={COLORS.zinc600}
              value={novaConfig.mensagem_lembrete_template}
              onChangeText={(text) => setNovaConfig({ ...novaConfig, mensagem_lembrete_template: text })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={styles.hint}>
              Use: {'{nome}'}, {'{servico}'}, {'{hora}'}, {'{barbearia}'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => salvarConfig.mutate(novaConfig)}
          disabled={salvarConfig.isPending}
        >
          {salvarConfig.isPending ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <>
              <Save color={COLORS.background} size={20} />
              <Text style={styles.saveButtonText}>Salvar Configurações</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Sobre os Lembretes</Text>
          <Text style={styles.infoText}>
            Lembretes são criados automaticamente quando você confirma um agendamento via WhatsApp.
          </Text>
          <Text style={styles.infoText}>
            A mensagem será enviada no horário configurado antes do agendamento.
          </Text>
          <Text style={styles.infoText}>
            Use as variáveis no template para personalizar cada mensagem.
          </Text>
        </View>
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
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 12,
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
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.zinc400,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.white,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: COLORS.zinc500,
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
  infoCard: {
    backgroundColor: `${COLORS.blue}20`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.zinc400,
    marginBottom: 8,
    lineHeight: 20,
  },
});
