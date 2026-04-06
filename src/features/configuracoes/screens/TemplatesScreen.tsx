import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Plus, Save, Star, Trash2 } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { TEMPLATE_TIPO_LABELS, type TemplateMensagem, type TemplateMensagemTipo } from '../../../lib/messageTemplates';
import { TEMPLATE_TIPOS } from '../types';

interface TemplatesScreenProps {
  isSaving: boolean;
  templates: TemplateMensagem[];
  templatesPorTipo: Record<TemplateMensagemTipo, TemplateMensagem[]>;
  onAddTemplate: (tipo: TemplateMensagemTipo) => void;
  onBack: () => void;
  onRemoveTemplate: (tipo: TemplateMensagemTipo, templateId: string) => void;
  onSave: () => void;
  onSetDefaultTemplate: (tipo: TemplateMensagemTipo, templateId: string) => void;
  onToggleTemplate: (tipo: TemplateMensagemTipo, templateId: string, ativo: boolean) => void;
  onUpdateTemplate: (templateId: string, patch: Partial<TemplateMensagem>) => void;
}

export function TemplatesScreen({
  isSaving,
  templates,
  templatesPorTipo,
  onAddTemplate,
  onBack,
  onRemoveTemplate,
  onSave,
  onSetDefaultTemplate,
  onToggleTemplate,
  onUpdateTemplate
}: TemplatesScreenProps) {
  const totalTemplates = templates.length;
  const totalTemplatesAtivos = templates.filter((template) => template.ativo).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
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
          <Text style={styles.templatesHelperDescription}>Essas variáveis são substituídas automaticamente quando a mensagem for usada no fluxo real.</Text>
        </View>

        {TEMPLATE_TIPOS.map((tipo) => {
          const templatesTipo = templatesPorTipo[tipo] || [];
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
                <TouchableOpacity style={styles.addTemplateButton} onPress={() => onAddTemplate(tipo)}>
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
                          {template.padrao ? 'Padrão' : `Variação ${index + 1}`}
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
                        onPress={() => onSetDefaultTemplate(tipo, template.id)}
                      >
                        <Star color={template.padrao ? COLORS.background : COLORS.gold} size={16} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconButton, styles.iconButtonDanger]}
                        onPress={() => onRemoveTemplate(tipo, template.id)}
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
                    onChangeText={(text) => onUpdateTemplate(template.id, { nome: text })}
                  />

                  <View style={styles.templateDivider} />

                    <View style={styles.templateToggleCard}>
                      <View style={styles.switchInfo}>
                        <Text style={styles.switchLabel}>Template ativo</Text>
                        <Text style={styles.switchDescription}>
                          {template.padrao ? 'Este template está selecionado como padrão.' : 'Ative para manter essa variação disponível.'}
                        </Text>
                      </View>
                    <Switch
                      value={template.ativo}
                      onValueChange={(value) => onToggleTemplate(tipo, template.id, value)}
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
                    onChangeText={(text) => onUpdateTemplate(template.id, { mensagem: text })}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>
              ))}
            </View>
          );
        })}

        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <>
              <Save color={COLORS.background} size={20} />
              <Text style={styles.saveButtonText}>Salvar templates</Text>
            </>
          )}
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
    letterSpacing: 0.5
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
  }
});
