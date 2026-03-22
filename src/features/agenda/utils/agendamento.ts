import {DEFAULT_AGENDA_CONFIG, getAgendaValidationMessage, isDateTimeWithinAgenda, normalizeAgendaConfig, type AgendaConfig} from './agendaConfig';

export const isHorarioAgendamentoValido = (
  dateValue: Date | string,
  config: AgendaConfig = DEFAULT_AGENDA_CONFIG
) => isDateTimeWithinAgenda(normalizeAgendaConfig(config), dateValue);

export const getHorarioAgendamentoMensagem = (
  config: AgendaConfig = DEFAULT_AGENDA_CONFIG,
  dateValue?: Date | string
) => getAgendaValidationMessage(normalizeAgendaConfig(config), dateValue);
