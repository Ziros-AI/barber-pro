import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, LogOut, Save, Settings } from 'lucide-react-native';
import { useAlert } from '../../../app/providers/AlertProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getTemplatePadraoPorTipo, normalizeTemplatesMensagem } from '../../../lib/messageTemplates';
import { supabase } from '../../../services/api/supabaseClient';
import { COLORS } from '../../../styles/colors';
import { useMessageTemplateManager } from '../hooks/useMessageTemplateManager';
import { DEFAULT_CONFIG, type ConfiguracaoForm } from '../types';
import { TemplatesScreen } from './TemplatesScreen';

export default function ConfiguracoesScreen() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();
  const { user, signOut } = useAuth();
  const [novaConfig, setNovaConfig] = useState<ConfiguracaoForm>(DEFAULT_CONFIG);
  const [activeView, setActiveView] = useState<'geral' | 'templates'>('geral');

  const { data, isLoading } = useQuery({
    queryKey: ['configuracoes', user?.id, 'mensagem-templates'],
    enabled: !!user?.id,
    queryFn: async () => {
      const [configResult, templatesResult] = await Promise.all([
        supabase
          .from('configuracoes')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('mensagem_templates')
          .select('id, nome, tipo, mensagem, ativo, padrao')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: true })
      ]);

      if (configResult.error) {
        throw configResult.error;
      }

      if (templatesResult.error) {
        throw templatesResult.error;
      }

      return {
        configuracao: configResult.data?.[0] || null,
        templates: templatesResult.data || []
      };
    }
  });

  useEffect(() => {
    const config = data?.configuracao;
    const templates = data?.templates || [];

    if (config) {
      const templateLegado = config.mensagem_lembrete_template || DEFAULT_CONFIG.mensagem_lembrete_template;
      setNovaConfig({
        id: config.id,
        nome_barbearia: config.nome_barbearia || '',
        mensagem_lembrete_template: templateLegado,
        mensagens_templates: normalizeTemplatesMensagem(templates, templateLegado),
        horas_lembrete: config.horas_lembrete ?? 24,
        lembretes_ativos: config.lembretes_ativos ?? true
      });
      return;
    }

    setNovaConfig({
      ...DEFAULT_CONFIG,
      mensagens_templates: normalizeTemplatesMensagem(templates, DEFAULT_CONFIG.mensagem_lembrete_template)
    });
  }, [data]);

  const {
    adicionarTemplate,
    alternarTemplateAtivo,
    atualizarTemplate,
    definirTemplatePadrao,
    removerTemplate,
    templatesPorTipo
  } = useMessageTemplateManager({
    mensagemLegada: novaConfig.mensagem_lembrete_template,
    templates: novaConfig.mensagens_templates,
    onBlockAction: (title, message) => showAlert(title, message, 'warning'),
    onChange: (mensagens_templates) => setNovaConfig((current) => ({ ...current, mensagens_templates }))
  });

  const salvarConfig = useMutation({
    mutationFn: async (formData: ConfiguracaoForm) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado.');
      }

      const templatesNormalizados = normalizeTemplatesMensagem(
        formData.mensagens_templates,
        formData.mensagem_lembrete_template
      );
      const templateLembretePadrao = getTemplatePadraoPorTipo(
        templatesNormalizados,
        'lembrete',
        formData.mensagem_lembrete_template
      );
      const configPayload = {
        nome_barbearia: formData.nome_barbearia,
        horas_lembrete: formData.horas_lembrete,
        lembretes_ativos: formData.lembretes_ativos,
        mensagem_lembrete_template: templateLembretePadrao,
        user_id: user.id
      };
      const { data: updatedConfigs, error: updateConfigError } = await supabase
        .from('configuracoes')
        .update(configPayload)
        .eq('user_id', user.id)
        .select('id');

      if (updateConfigError) {
        throw updateConfigError;
      }

      if (!updatedConfigs || updatedConfigs.length === 0) {
        const { error: insertConfigError } = await supabase
          .from('configuracoes')
          .insert([configPayload]);

        if (insertConfigError) {
          if (insertConfigError.code !== '23505') {
            throw insertConfigError;
          }

          const { error: retryUpdateConfigError } = await supabase
            .from('configuracoes')
            .update(configPayload)
            .eq('user_id', user.id);

          if (retryUpdateConfigError) {
            throw retryUpdateConfigError;
          }
        }
      }

      const templateTimestamp = new Date().toISOString();
      const templatesPayload = templatesNormalizados.map((template) => ({
        id: template.id,
        user_id: user.id,
        nome: template.nome,
        tipo: template.tipo,
        mensagem: template.mensagem,
        ativo: template.ativo,
        padrao: template.padrao,
        updated_at: templateTimestamp
      }));
      const idsAtuais = new Set((data?.templates || []).map((template) => String(template.id)));
      const idsNovos = new Set(templatesPayload.map((template) => template.id));
      const idsParaRemover = Array.from(idsAtuais).filter((id) => !idsNovos.has(id));

      if (idsParaRemover.length > 0) {
        const { error } = await supabase
          .from('mensagem_templates')
          .delete()
          .eq('user_id', user.id)
          .in('id', idsParaRemover);

        if (error) {
          throw error;
        }
      }

      const { error: upsertError } = await supabase
        .from('mensagem_templates')
        .upsert(templatesPayload, { onConflict: 'id' });

      if (upsertError) {
        throw upsertError;
      }

      return {
        ...formData,
        mensagem_lembrete_template: templateLembretePadrao,
        mensagens_templates: templatesNormalizados
      };
    },
    onSuccess: (savedConfig) => {
      setNovaConfig(savedConfig);
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
      queryClient.invalidateQueries({ queryKey: ['configuracoes', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['configuracoes', user?.id, 'mensagem-templates'] });
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'agenda', user?.id] });
      showAlert('Sucesso', 'Configurações salvas com sucesso!', 'success');
    },
    onError: (error) => {
      console.log('ERRO COMPLETO:', error);
      showAlert('Erro', JSON.stringify(error), 'error');
    }
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const handleSave = () => salvarConfig.mutate(novaConfig);

  const renderSaveButton = (label: string) => (
    <TouchableOpacity
      style={styles.saveButton}
      onPress={handleSave}
      disabled={salvarConfig.isPending}
    >
      {salvarConfig.isPending ? (
        <ActivityIndicator size="small" color={COLORS.background} />
      ) : (
        <>
          <Save color={COLORS.background} size={20} />
          <Text style={styles.saveButtonText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const handleLogoff = () => {
    showConfirm(
      'Sair da conta',
      'Deseja encerrar sua sessao neste dispositivo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Erro ao sair da conta:', error);
              showAlert('Erro', 'Nao foi possivel sair da conta agora.', 'error');
            }
          }
        }
      ]
    );
  };

  if (activeView === 'templates') {
    return (
      <TemplatesScreen
        isSaving={salvarConfig.isPending}
        templates={novaConfig.mensagens_templates}
        templatesPorTipo={templatesPorTipo}
        onAddTemplate={adicionarTemplate}
        onBack={() => setActiveView('geral')}
        onRemoveTemplate={removerTemplate}
        onSave={handleSave}
        onSetDefaultTemplate={definirTemplatePadrao}
        onToggleTemplate={alternarTemplateAtivo}
        onUpdateTemplate={atualizarTemplate}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Settings color={COLORS.gold} size={32} />
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Personalize sua barbearia</Text>
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
          <Text style={styles.sectionTitle}>Lembretes Automáticos</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Ativar Lembretes</Text>
              <Text style={styles.switchDescription}>Criar lembretes automaticamente ao confirmar agendamento</Text>
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
        </View>

        <TouchableOpacity style={styles.navigationCard} onPress={() => setActiveView('templates')}>
          <View style={styles.navigationCardContent}>
            <Text style={styles.navigationCardTitle}>Templates de Mensagem</Text>
            <Text style={styles.navigationCardDescription}>Acesse uma tela dedicada para organizar confirmações, lembretes e demais variações.</Text>
          </View>
          <View style={styles.navigationCardIcon}>
            <ChevronRight color={COLORS.gold} size={20} />
          </View>
        </TouchableOpacity>

        {renderSaveButton('Salvar Configuracoes')}

        <TouchableOpacity style={styles.logoffButton} onPress={handleLogoff}>
          <LogOut color="#fca5a5" size={18} />
          <Text style={styles.logoffButtonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  header: {
    backgroundColor: COLORS.cardBg,
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 12,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc400
  },
  content: {
    padding: 16
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.zinc400,
    marginBottom: 8
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.white
  },
  hint: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginTop: 6
  },
  navigationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    flexDirection: 'row',
    alignItems: 'center'
  },
  navigationCardContent: {
    flex: 1,
    marginRight: 12
  },
  navigationCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6
  },
  navigationCardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.zinc400
  },
  navigationCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.gold}15`,
    justifyContent: 'center',
    alignItems: 'center'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8
  },
  switchInfo: {
    flex: 1,
    marginRight: 16
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4
  },
  switchDescription: {
    fontSize: 12,
    color: COLORS.zinc500
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background
  },
  logoffButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
  },
  logoffButtonText: {
    color: '#fecaca',
    fontSize: 15,
    fontWeight: '700'
  }
});
