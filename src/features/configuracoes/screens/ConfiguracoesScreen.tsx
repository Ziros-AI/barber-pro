import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, StyleSheet, Switch } from 'react-native';
import { supabase } from '../../../services/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, LogOut, Plus, Save, Settings, Star, Trash2 } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { useAlert } from '../../../app/providers/AlertProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import { createTemplateMensagem, DEFAULT_TEMPLATE_MESSAGES, ensureTemplatePadraoUnico, getTemplatePadraoPorTipo, normalizeTemplatesMensagem, TEMPLATE_TIPO_LABELS, type TemplateMensagem, type TemplateMensagemTipo } from '../../../lib/messageTemplates';

interface ConfiguracaoForm {
  id?: string;
  nome_barbearia: string;
  horas_lembrete: number;
  mensagem_lembrete_template: string;
  mensagens_templates: TemplateMensagem[];
  lembretes_ativos: boolean;
}

const DEFAULT_CONFIG: ConfiguracaoForm = {
  nome_barbearia: 'Barbearia',
  horas_lembrete: 24,
  mensagem_lembrete_template: 'Ola {nome}, lembrete do seu {servico} amanha as {hora}. Te esperamos! - {barbearia}',
  mensagens_templates: DEFAULT_TEMPLATE_MESSAGES,
  lembretes_ativos: true
};

const TEMPLATE_TIPOS: TemplateMensagemTipo[] = ['confirmacao', 'lembrete', 'reagendamento', 'nao_comparecimento', 'pos_atendimento'];

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

  const templatesPorTipo = useMemo(
    () =>
      TEMPLATE_TIPOS.reduce((acc, tipo) => {
        acc[tipo] = novaConfig.mensagens_templates.filter((template) => template.tipo === tipo);
        return acc;
      }, {} as Record<TemplateMensagemTipo, TemplateMensagem[]>),
    [novaConfig.mensagens_templates]
  );

  const atualizarTemplates = (nextTemplates: TemplateMensagem[]) => {
    setNovaConfig((current) => ({
      ...current,
      mensagens_templates: normalizeTemplatesMensagem(nextTemplates, current.mensagem_lembrete_template)
    }));
  };

  const atualizarTemplate = (templateId: string, patch: Partial<TemplateMensagem>) => {
    atualizarTemplates(
      novaConfig.mensagens_templates.map((template) =>
        template.id === templateId
          ? {
              ...template,
              ...patch
            }
          : template
      )
    );
  };

  const alternarTemplateAtivo = (tipo: TemplateMensagemTipo, templateId: string, ativo: boolean) => {
    const templatesTipo = templatesPorTipo[tipo] || [];
    const ativosRestantes = templatesTipo.filter((template) => template.id !== templateId && template.ativo);

    if (!ativo && ativosRestantes.length === 0) {
      showAlert('Acao bloqueada', 'Cada tipo precisa manter pelo menos um template ativo.', 'warning');
      return;
    }

    atualizarTemplate(templateId, { ativo });
  };

  const adicionarTemplate = (tipo: TemplateMensagemTipo) => {
    const totalTipo = templatesPorTipo[tipo]?.length || 0;
    atualizarTemplates([...novaConfig.mensagens_templates, createTemplateMensagem(tipo, totalTipo + 1)]);
  };

  const removerTemplate = (tipo: TemplateMensagemTipo, templateId: string) => {
    const templatesTipo = templatesPorTipo[tipo] || [];

    if (templatesTipo.length <= 1) {
      showAlert('Acao bloqueada', 'Cada tipo precisa manter pelo menos um template.', 'warning');
      return;
    }

    const nextTemplates = novaConfig.mensagens_templates.filter((template) => template.id !== templateId);
    atualizarTemplates(nextTemplates);
  };

  const definirTemplatePadrao = (tipo: TemplateMensagemTipo, templateId: string) => {
    atualizarTemplates(ensureTemplatePadraoUnico(novaConfig.mensagens_templates, tipo, templateId));
  };

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

  const renderSaveButton = (label: string) => (
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
    const totalTemplates = novaConfig.mensagens_templates.length;
    const totalTemplatesAtivos = novaConfig.mensagens_templates.filter((template) => template.ativo).length;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('geral')}>
            <ArrowLeft color={COLORS.white} size={20} />
          </TouchableOpacity>
          <View style={styles.subHeaderText}>
            <Text style={styles.subHeaderTitle}>Templates de Mensagem</Text>
            <Text style={styles.subHeaderSubtitle}>Gerencie variações, ativos e padrões de cada tipo.</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.templatesSummaryCard}>
            <View style={styles.templatesSummaryTextWrap}>
              <Text style={styles.templatesSummaryTitle}>Central de mensagens</Text>
              <Text style={styles.templatesSummaryDescription}>Escolha o padrão de cada fluxo e mantenha só as variações que realmente fazem sentido para o atendimento.</Text>
            </View>

            <View style={styles.templatesSummaryStats}>
              <View style={styles.templatesSummaryStat}>
                <Text style={styles.templatesSummaryStatValue}>{totalTemplates}</Text>
                <Text style={styles.templatesSummaryStatLabel}>Templates</Text>
              </View>
              <View style={styles.templatesSummaryStat}>
                <Text style={styles.templatesSummaryStatValue}>{totalTemplatesAtivos}</Text>
                <Text style={styles.templatesSummaryStatLabel}>Ativos</Text>
              </View>
            </View>
          </View>

          <View style={styles.templatesHelperCard}>
            <Text style={styles.templatesHelperTitle}>Variáveis disponíveis</Text>
            <View style={styles.variableChipsRow}>
              <View style={styles.variableChip}>
                <Text style={styles.variableChipText}>{'{nome}'}</Text>
              </View>
              <View style={styles.variableChip}>
                <Text style={styles.variableChipText}>{'{servico}'}</Text>
              </View>
              <View style={styles.variableChip}>
                <Text style={styles.variableChipText}>{'{hora}'}</Text>
              </View>
              <View style={styles.variableChip}>
                <Text style={styles.variableChipText}>{'{barbearia}'}</Text>
              </View>
            </View>
            <Text style={styles.templatesHelperDescription}>Essas variáveis são substituidas automaticamente quando a mensagem for usada no fluxo real.</Text>
          </View>

          {TEMPLATE_TIPOS.map((tipo) => {
            const templatesTipo = templatesPorTipo[tipo];
            const totalAtivosTipo = templatesTipo.filter((template) => template.ativo).length;

            return (
              <View key={tipo} style={styles.templateCategoryCard}>
                <View style={styles.templateTypeHeader}>
                  <View style={styles.templateCategoryHeaderLeft}>
                    <View style={styles.templateCategoryBadge}>
                      <Text style={styles.templateCategoryBadgeText}>{templatesTipo.length}</Text>
                    </View>
                    <Text style={styles.templateTypeTitle}>{TEMPLATE_TIPO_LABELS[tipo]}</Text>
                    <Text style={styles.templateTypeDescription}>Defina variações, mantenha {totalAtivosTipo} ativo{totalAtivosTipo === 1 ? '' : 's'} e escolha qual será o padrão desse fluxo.</Text>
                  </View>
                  <TouchableOpacity style={styles.addTemplateButton} onPress={() => adicionarTemplate(tipo)}>
                    <Plus color={COLORS.background} size={16} />
                    <Text style={styles.addTemplateButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>

                {templatesTipo.map((template, index) => (
                  <View key={template.id} style={[styles.templateCard, template.padrao && styles.templateCardDefault]}>
                    <View style={styles.templateCardHeader}>
                      <View style={styles.templateCardMeta}>
                        <View style={[styles.templateStatusPill, template.padrao ? styles.templateStatusPillDefault : styles.templateStatusPillSecondary]}>
                          <Text style={[styles.templateStatusPillText, template.padrao ? styles.templateStatusPillTextDefault : styles.templateStatusPillTextSecondary]}>
                            {template.padrao ? 'Padrao' : `Variacao ${index + 1}`}
                          </Text>
                        </View>
                        {!template.ativo ? (
                          <View style={[styles.templateStatusPill, styles.templateStatusPillInactive]}>
                            <Text style={[styles.templateStatusPillText, styles.templateStatusPillTextInactive]}>Inativo</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.templateActionsRow}>
                        <TouchableOpacity
                          style={[styles.iconButton, template.padrao && styles.iconButtonActive]}
                          onPress={() => definirTemplatePadrao(tipo, template.id)}
                        >
                          <Star color={template.padrao ? COLORS.background : COLORS.gold} size={16} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.iconButton, styles.iconButtonDanger]}
                          onPress={() => removerTemplate(tipo, template.id)}
                        >
                          <Trash2 color="#fca5a5" size={16} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.templateCardLabel}>Nome interno</Text>
                    <TextInput
                      style={[styles.input, styles.templateNameInput]}
                      placeholder={`Nome do template de ${TEMPLATE_TIPO_LABELS[tipo]}`}
                      placeholderTextColor={COLORS.zinc600}
                      value={template.nome}
                      onChangeText={(text) => atualizarTemplate(template.id, { nome: text })}
                    />

                    <View style={styles.templateDivider} />

                    <View style={styles.templateToggleCard}>
                      <View style={styles.switchInfo}>
                        <Text style={styles.switchLabel}>Template ativo</Text>
                        <Text style={styles.switchDescription}>
                          {template.padrao ? 'Este template esta selecionado como padrao.' : 'Ative para manter essa variacao disponivel.'}
                        </Text>
                      </View>
                      <Switch
                        value={template.ativo}
                        onValueChange={(value) => alternarTemplateAtivo(tipo, template.id, value)}
                        trackColor={{ false: COLORS.zinc700, true: COLORS.gold }}
                        thumbColor={template.ativo ? COLORS.white : COLORS.zinc400}
                      />
                    </View>

                    <Text style={styles.templateCardLabel}>Mensagem</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, styles.templateMessageInput]}
                      placeholder="Digite a mensagem do template..."
                      placeholderTextColor={COLORS.zinc600}
                      value={template.mensagem}
                      onChangeText={(text) => atualizarTemplate(template.id, { mensagem: text })}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />
                  </View>
                ))}
              </View>
            );
          })}

          {renderSaveButton('Salvar Templates')}
        </View>
      </ScrollView>
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
  subHeader: {
    backgroundColor: COLORS.cardBg,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.zinc700,
    marginRight: 14
  },
  subHeaderText: {
    flex: 1
  },
  subHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4
  },
  subHeaderSubtitle: {
    fontSize: 13,
    color: COLORS.zinc400
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
  templatesSummaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc800
  },
  templatesSummaryTextWrap: {
    marginBottom: 14
  },
  templatesSummaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6
  },
  templatesSummaryDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.zinc300,
    maxWidth: '96%'
  },
  templatesSummaryStats: {
    flexDirection: 'row',
    gap: 10
  },
  templatesSummaryStat: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  templatesSummaryStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4
  },
  templatesSummaryStatLabel: {
    fontSize: 12,
    color: COLORS.zinc400
  },
  templatesHelperCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.22)'
  },
  templatesHelperTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 12
  },
  variableChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  variableChip: {
    backgroundColor: 'rgba(9, 9, 11, 0.55)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  variableChipText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700'
  },
  templatesHelperDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.zinc300
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  sectionHeader: {
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.zinc400
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
  textArea: {
    minHeight: 120,
    paddingTop: 12
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
  templateCategoryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    marginBottom: 16
  },
  templateTypeSection: {
    marginTop: 0
  },
  templateTypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12
  },
  templateCategoryHeaderLeft: {
    flex: 1
  },
  templateCategoryBadge: {
    alignSelf: 'flex-start',
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${COLORS.gold}18`,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    marginBottom: 10
  },
  templateCategoryBadgeText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center'
  },
  templateTypeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4
  },
  templateTypeDescription: {
    fontSize: 13,
    color: COLORS.zinc400,
    lineHeight: 19,
    maxWidth: 240
  },
  addTemplateButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  addTemplateButtonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 13
  },
  templateCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    marginBottom: 12
  },
  templateCardDefault: {
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(212, 175, 55, 0.06)'
  },
  templateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  templateCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    marginRight: 12
  },
  templateStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1
  },
  templateStatusPillDefault: {
    backgroundColor: `${COLORS.gold}18`,
    borderColor: 'rgba(212, 175, 55, 0.32)'
  },
  templateStatusPillSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  templateStatusPillInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.22)'
  },
  templateStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  templateStatusPillTextDefault: {
    color: COLORS.gold
  },
  templateStatusPillTextSecondary: {
    color: COLORS.zinc300
  },
  templateStatusPillTextInactive: {
    color: '#fca5a5'
  },
  templateActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  templateCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.zinc500,
    marginBottom: 8
  },
  templateNameInput: {
    flex: 1
  },
  templateDivider: {
    height: 1,
    backgroundColor: COLORS.zinc800,
    marginVertical: 14
  },
  templateToggleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  templateMessageInput: {
    backgroundColor: 'rgba(9, 9, 11, 0.7)'
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.zinc700
  },
  iconButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold
  },
  iconButtonDanger: {
    borderColor: 'rgba(239, 68, 68, 0.35)'
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
  },
  infoCard: {
    backgroundColor: `${COLORS.blue}20`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
    borderRadius: 12,
    padding: 16
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12
  },
  infoText: {
    fontSize: 14,
    color: COLORS.zinc400,
    marginBottom: 8,
    lineHeight: 20
  }
});
