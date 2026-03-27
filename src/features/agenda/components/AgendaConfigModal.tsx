import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Check, Coffee, Plus, TimerReset, X } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import {
  DAY_LABELS,
  DEFAULT_AGENDA_CONFIG,
  formatMinutesToTime,
  normalizeAgendaConfig,
  parseTimeToMinutes,
  type AgendaConfig,
} from '../utils/agendaConfig';

type EditableField = 'startTime' | 'endTime' | 'pauseStart' | 'pauseEnd';

interface ActivePicker {
  dayIndex: number;
  field: EditableField;
  pauseIndex?: number;
}

interface AgendaConfigModalProps {
  visible: boolean;
  initialConfig?: AgendaConfig;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (config: AgendaConfig) => void;
}

const SLOT_OPTIONS = [15, 30, 45, 60];

const buildPickerDate = (time: string | null | undefined) => {
  const baseDate = new Date();
  const minutes = parseTimeToMinutes(time ?? null);

  if (minutes === null) {
    baseDate.setHours(12, 0, 0, 0);
    return baseDate;
  }

  baseDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return baseDate;
};

export const AgendaConfigModal: React.FC<AgendaConfigModalProps> = ({
  visible,
  initialConfig,
  isSaving = false,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<AgendaConfig>(normalizeAgendaConfig(initialConfig));
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(normalizeAgendaConfig(initialConfig || DEFAULT_AGENDA_CONFIG));
      setActivePicker(null);
    }
  }, [visible, initialConfig]);

  const pickerValue = useMemo(() => {
    if (!activePicker) {
      return buildPickerDate('12:00');
    }

    const day = draft.weekSchedule[activePicker.dayIndex];

    if (activePicker.field === 'pauseStart' || activePicker.field === 'pauseEnd') {
      const pause = day?.pauses[activePicker.pauseIndex || 0];
      return buildPickerDate(activePicker.field === 'pauseStart' ? pause?.startTime : pause?.endTime);
    }

    return buildPickerDate(day?.[activePicker.field]);
  }, [activePicker, draft.weekSchedule]);

  const updateDay = (
    dayIndex: number,
    updater: (current: AgendaConfig['weekSchedule'][number]) => AgendaConfig['weekSchedule'][number]
  ) => {
    setDraft((current) => ({
      ...current,
      weekSchedule: current.weekSchedule.map((day, index) => (index === dayIndex ? updater(day) : day)),
    }));
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedValue?: Date) => {
    if (!activePicker) {
      return;
    }

    if (event.type === 'dismissed') {
      setActivePicker(null);
      return;
    }

    if (!selectedValue) {
      return;
    }

    const newTime = formatMinutesToTime(selectedValue.getHours() * 60 + selectedValue.getMinutes());

    updateDay(activePicker.dayIndex, (currentDay) => {
      if (activePicker.field === 'pauseStart' || activePicker.field === 'pauseEnd') {
        const pauseIndex = activePicker.pauseIndex || 0;
        return {
          ...currentDay,
          pauses: currentDay.pauses.map((pause, index) =>
            index === pauseIndex
              ? {
                  ...pause,
                  startTime: activePicker.field === 'pauseStart' ? newTime : pause.startTime,
                  endTime: activePicker.field === 'pauseEnd' ? newTime : pause.endTime,
                }
              : pause
          ),
        };
      }

      return {
        ...currentDay,
        [activePicker.field]: newTime,
      };
    });

    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Escala da Agenda</Text>
              <Text style={styles.subtitle}>Defina dias, expediente, pausas e intervalo</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.white} size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tempo por agendamento</Text>
              <View style={styles.slotOptions}>
                {SLOT_OPTIONS.map((option) => {
                  const isActive = draft.slotDurationMinutes === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.slotOption, isActive && styles.slotOptionActive]}
                      onPress={() => setDraft((current) => ({ ...current, slotDurationMinutes: option }))}
                    >
                      <Text style={[styles.slotOptionText, isActive && styles.slotOptionTextActive]}>
                        {option} min
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dias da semana</Text>
              {draft.weekSchedule.map((day, index) => (
                <View key={DAY_LABELS[index]} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <View>
                      <Text style={styles.dayTitle}>{DAY_LABELS[index]}</Text>
                      <Text style={styles.daySubtitle}>
                        {day.enabled ? 'Dia habilitado para agendamentos' : 'Sem atendimento'}
                      </Text>
                    </View>
                    <Switch
                      value={day.enabled}
                      onValueChange={(value) =>
                        updateDay(index, (currentDay) => ({
                          ...currentDay,
                          enabled: value,
                        }))
                      }
                      trackColor={{ false: COLORS.zinc700, true: COLORS.gold }}
                      thumbColor={day.enabled ? COLORS.white : COLORS.zinc400}
                    />
                  </View>

                  {day.enabled && (
                    <>
                      <View style={styles.row}>
                        <TouchableOpacity
                          style={styles.timeButton}
                          onPress={() => setActivePicker({ dayIndex: index, field: 'startTime' })}
                        >
                          <Text style={styles.timeLabel}>Inicio</Text>
                          <Text style={styles.timeValue}>{day.startTime}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.timeButton}
                          onPress={() => setActivePicker({ dayIndex: index, field: 'endTime' })}
                        >
                          <Text style={styles.timeLabel}>Fim</Text>
                          <Text style={styles.timeValue}>{day.endTime}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.pauseHeader}>
                        <View style={styles.pauseHeaderLeft}>
                          <Coffee color={COLORS.gold} size={16} />
                          <Text style={styles.pauseTitle}>Pausas do dia</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            updateDay(index, (currentDay) => ({
                              ...currentDay,
                              pauses: [...currentDay.pauses, { startTime: '12:00', endTime: '13:00' }],
                            }))
                          }
                          style={styles.addPauseButton}
                        >
                          <Plus color={COLORS.background} size={14} />
                          <Text style={styles.addPauseButtonText}>Adicionar pausa</Text>
                        </TouchableOpacity>
                      </View>

                      {day.pauses.length === 0 ? (
                        <Text style={styles.noPausesText}>Nenhuma pausa configurada.</Text>
                      ) : (
                        day.pauses.map((pause, pauseIndex) => (
                          <View key={`${DAY_LABELS[index]}-${pauseIndex}`} style={styles.pauseCard}>
                            <View style={styles.pauseCardHeader}>
                              <Text style={styles.pauseCardTitle}>Pausa {pauseIndex + 1}</Text>
                              <TouchableOpacity
                                onPress={() =>
                                  updateDay(index, (currentDay) => ({
                                    ...currentDay,
                                    pauses: currentDay.pauses.filter((_, currentPauseIndex) => currentPauseIndex !== pauseIndex),
                                  }))
                                }
                              >
                                <Text style={styles.removePauseText}>Remover</Text>
                              </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                              <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() =>
                                  setActivePicker({ dayIndex: index, field: 'pauseStart', pauseIndex })
                                }
                              >
                                <Text style={styles.timeLabel}>Inicio</Text>
                                <Text style={styles.timeValue}>{pause.startTime}</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() =>
                                  setActivePicker({ dayIndex: index, field: 'pauseEnd', pauseIndex })
                                }
                              >
                                <Text style={styles.timeLabel}>Fim</Text>
                                <Text style={styles.timeValue}>{pause.endTime}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.infoCard}>
              <TimerReset color={COLORS.gold} size={18} />
              <Text style={styles.infoText}>
                A grade da agenda passa a seguir o intervalo escolhido. Ex.: 30 min gera slots 08:00, 08:30, 09:00...
              </Text>
            </View>

            {activePicker && Platform.OS !== 'android' && (
              <View style={styles.pickerCard}>
                <DateTimePicker
                  value={pickerValue}
                  mode="time"
                  display="spinner"
                  is24Hour
                  onChange={handleTimeChange}
                />
              </View>
            )}
          </ScrollView>

          {activePicker && Platform.OS === 'android' && (
            <DateTimePicker value={pickerValue} mode="time" is24Hour onChange={handleTimeChange} />
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, isSaving && styles.disabledButton]}
              onPress={() => onSave(normalizeAgendaConfig(draft))}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <>
                  <Check color={COLORS.background} size={18} />
                  <Text style={styles.primaryButtonText}>Salvar escala</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '88%',
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc800,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.zinc400,
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
  },
  slotOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
  },
  slotOptionActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  slotOptionText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  slotOptionTextActive: {
    color: COLORS.background,
  },
  dayCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  daySubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.zinc500,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  timeButton: {
    flex: 1,
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.zinc400,
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  pauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  pauseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pauseTitle: {
    color: COLORS.white,
    fontWeight: '700',
    marginLeft: 8,
  },
  addPauseButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addPauseButtonText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 12,
  },
  noPausesText: {
    color: COLORS.zinc500,
    fontSize: 13,
    marginBottom: 8,
  },
  pauseCard: {
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
    marginBottom: 10,
  },
  pauseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pauseCardTitle: {
    color: COLORS.white,
    fontWeight: '700',
  },
  removePauseText: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: `${COLORS.gold}15`,
    borderWidth: 1,
    borderColor: `${COLORS.gold}40`,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    color: COLORS.zinc300,
    flex: 1,
    lineHeight: 20,
  },
  pickerCard: {
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
