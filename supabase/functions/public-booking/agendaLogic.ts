import { DateTime } from "npm:luxon@3.4.4";

export interface AgendaPauseConfig {
  startTime: string;
  endTime: string;
}

export interface AgendaDayConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  pauses: AgendaPauseConfig[];
}

export interface AgendaConfig {
  slotDurationMinutes: number;
  weekSchedule: AgendaDayConfig[];
}

export const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export const DEFAULT_WEEK_SCHEDULE: AgendaDayConfig[] = [
  { enabled: true, startTime: "08:00", endTime: "19:00", pauses: [{ startTime: "12:00", endTime: "13:00" }] },
  { enabled: true, startTime: "08:00", endTime: "19:00", pauses: [{ startTime: "12:00", endTime: "13:00" }] },
  { enabled: true, startTime: "08:00", endTime: "19:00", pauses: [{ startTime: "12:00", endTime: "13:00" }] },
  { enabled: true, startTime: "08:00", endTime: "19:00", pauses: [{ startTime: "12:00", endTime: "13:00" }] },
  { enabled: true, startTime: "08:00", endTime: "19:00", pauses: [{ startTime: "12:00", endTime: "13:00" }] },
  { enabled: true, startTime: "08:00", endTime: "19:00", pauses: [{ startTime: "12:00", endTime: "13:00" }] },
  { enabled: true, startTime: "08:00", endTime: "19:00", pauses: [{ startTime: "12:00", endTime: "13:00" }] },
];

export const DEFAULT_AGENDA_CONFIG: AgendaConfig = {
  slotDurationMinutes: 60,
  weekSchedule: DEFAULT_WEEK_SCHEDULE,
};

type LegacyAgendaDayConfig = Partial<AgendaDayConfig> & {
  lunchStart?: string | null;
  lunchEnd?: string | null;
};

export const parseTimeToMinutes = (time: string | null | undefined): number | null => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
};

export const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const sanitizePause = (
  pause?: Partial<AgendaPauseConfig> | { startTime?: string | null; endTime?: string | null } | null,
): AgendaPauseConfig | null => {
  const startTime = pause?.startTime ?? null;
  const endTime = pause?.endTime ?? null;
  if (parseTimeToMinutes(startTime) === null || parseTimeToMinutes(endTime) === null) return null;
  if (parseTimeToMinutes(startTime)! >= parseTimeToMinutes(endTime)!) return null;
  return { startTime: startTime!, endTime: endTime! };
};

const getLegacyPauses = (day?: LegacyAgendaDayConfig | null): AgendaPauseConfig[] => {
  if (!day?.lunchStart || !day?.lunchEnd) return [];
  const pause = sanitizePause({ startTime: day.lunchStart, endTime: day.lunchEnd });
  return pause ? [pause] : [];
};

const sanitizeDayConfig = (
  day?: LegacyAgendaDayConfig | null,
  fallback: AgendaDayConfig = DEFAULT_WEEK_SCHEDULE[0],
): AgendaDayConfig => {
  const startTime = day?.startTime === undefined ? fallback.startTime : day.startTime;
  const endTime = day?.endTime === undefined ? fallback.endTime : day.endTime;
  const incomingPauses = Array.isArray(day?.pauses) ? day.pauses : getLegacyPauses(day);
  const pauses = incomingPauses
    .map((p) => sanitizePause(p))
    .filter((p): p is AgendaPauseConfig => Boolean(p))
    .sort((a, b) => parseTimeToMinutes(a.startTime)! - parseTimeToMinutes(b.startTime)!);

  return {
    enabled: day?.enabled ?? false,
    startTime: parseTimeToMinutes(startTime) !== null ? startTime : fallback.startTime,
    endTime: parseTimeToMinutes(endTime) !== null ? endTime : fallback.endTime,
    pauses,
  };
};

export const normalizeAgendaConfig = (rawConfig?: Partial<AgendaConfig> | null): AgendaConfig => {
  const slotDurationMinutes =
    rawConfig?.slotDurationMinutes && [15, 30, 45, 60].includes(rawConfig.slotDurationMinutes)
      ? rawConfig.slotDurationMinutes
      : DEFAULT_AGENDA_CONFIG.slotDurationMinutes;

  const incomingSchedule = Array.isArray(rawConfig?.weekSchedule) ? rawConfig.weekSchedule : [];
  const weekSchedule = DEFAULT_WEEK_SCHEDULE.map((defaultDay, index) =>
    sanitizeDayConfig(
      { ...defaultDay, ...(incomingSchedule[index] || {}) },
      defaultDay,
    )
  );

  return { slotDurationMinutes, weekSchedule };
};

/** Luxon: Mon=1 … Sun=7 → JS getDay Sun=0 … Sat=6 */
export const luxonWeekdayToJsDay = (weekday: number): number => weekday % 7;

export const getAgendaDayConfig = (config: AgendaConfig, jsDay: number): AgendaDayConfig =>
  config.weekSchedule[jsDay] || DEFAULT_WEEK_SCHEDULE[jsDay];

export const getTimeSlotsForDate = (config: AgendaConfig, dayStart: DateTime): string[] => {
  const jsDay = luxonWeekdayToJsDay(dayStart.weekday);
  const dayConfig = getAgendaDayConfig(config, jsDay);
  if (!dayConfig.enabled) return [];

  const startMinutes = parseTimeToMinutes(dayConfig.startTime);
  const endMinutes = parseTimeToMinutes(dayConfig.endTime);
  if (startMinutes === null || endMinutes === null || startMinutes > endMinutes) return [];

  const slots: string[] = [];
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += config.slotDurationMinutes) {
    const isPaused = dayConfig.pauses.some((pause) => {
      const pauseStart = parseTimeToMinutes(pause.startTime);
      const pauseEnd = parseTimeToMinutes(pause.endTime);
      return (
        pauseStart !== null &&
        pauseEnd !== null &&
        pauseStart < pauseEnd &&
        minutes >= pauseStart &&
        minutes < pauseEnd
      );
    });
    if (!isPaused) slots.push(formatMinutesToTime(minutes));
  }
  return slots;
};

export const isDateTimeWithinAgenda = (config: AgendaConfig, local: DateTime): boolean => {
  const jsDay = luxonWeekdayToJsDay(local.weekday);
  const dayConfig = getAgendaDayConfig(config, jsDay);
  if (!dayConfig.enabled) return false;

  const minutes = local.hour * 60 + local.minute;
  const slots = getTimeSlotsForDate(config, local.startOf("day"));
  const hhmm = local.toFormat("HH:mm");
  return slots.includes(hhmm) && minutes % config.slotDurationMinutes === 0;
};

export const getHorarioAgendamentoMensagem = (
  config: AgendaConfig,
  local?: DateTime | null,
): string => {
  if (local) {
    const jsDay = luxonWeekdayToJsDay(local.weekday);
    const dayConfig = getAgendaDayConfig(config, jsDay);
    if (!dayConfig.enabled) {
      return `O barbeiro não atende ${DAY_LABELS[jsDay].toLowerCase()}.`;
    }
    const pausesMessage = dayConfig.pauses.length
      ? ` Pausas: ${dayConfig.pauses.map((p) => `${p.startTime} às ${p.endTime}`).join(", ")}.`
      : "";
    return `Escolha um horário válido de ${dayConfig.startTime} até ${dayConfig.endTime} com intervalos de ${config.slotDurationMinutes} min.${pausesMessage}`;
  }
  return `Escolha um horário válido respeitando a grade configurada e intervalos de ${config.slotDurationMinutes} min.`;
};

export const getDuracaoEfetivaMinutos = (
  duracaoServicoMinutos: number | undefined,
  slotDurationMinutes: number,
): number => {
  const base = Number.isFinite(duracaoServicoMinutos as number)
    ? Number(duracaoServicoMinutos)
    : slotDurationMinutes;
  return Math.max(slotDurationMinutes, base);
};

export interface AgendamentoConflitoRow {
  id: string;
  data_hora: string;
  servico_id?: string | null;
  status: string;
  cliente_nome?: string | null;
  servicos?: { duracao?: number | null } | null;
}

const agendamentoBloqueiaGrade = (a: AgendamentoConflitoRow) =>
  a.status === "pendente" || a.status === "confirmado";

export const getIntervaloAgendamentoUtc = (dataHoraIso: string, duracaoMinutos: number) => {
  const start = DateTime.fromISO(dataHoraIso, { setZone: true }).toUTC();
  const end = start.plus({ minutes: duracaoMinutos });
  return { start, end };
};

export const intervalosSobrepostos = (
  startA: DateTime,
  endA: DateTime,
  startB: DateTime,
  endB: DateTime,
) => startA.toMillis() < endB.toMillis() && startB.toMillis() < endA.toMillis();

export const getDuracaoAgendamentoNaGrade = (
  agendamento: AgendamentoConflitoRow,
  slotDurationMinutes: number,
) =>
  getDuracaoEfetivaMinutos(
    agendamento.servicos?.duracao != null ? Number(agendamento.servicos.duracao) : undefined,
    slotDurationMinutes,
  );

export const encontrarConflitoDeHorario = (params: {
  inicio: DateTime;
  fim: DateTime;
  candidatoId?: string;
  existentes: AgendamentoConflitoRow[];
  slotDurationMinutes: number;
}): AgendamentoConflitoRow | null => {
  const { inicio, fim, candidatoId, existentes, slotDurationMinutes } = params;

  for (const outro of existentes) {
    if (!agendamentoBloqueiaGrade(outro)) continue;
    if (candidatoId && outro.id === candidatoId) continue;

    const duracao = getDuracaoAgendamentoNaGrade(outro, slotDurationMinutes);
    const { start: oStart, end: oEnd } = getIntervaloAgendamentoUtc(outro.data_hora, duracao);

    if (intervalosSobrepostos(inicio, fim, oStart, oEnd)) return outro;
  }
  return null;
};

export const mensagemConflitoHorario = (conflito: AgendamentoConflitoRow): string => {
  const hora = DateTime.fromISO(conflito.data_hora, { setZone: true });
  const hh = String(hora.hour).padStart(2, "0");
  const mm = String(hora.minute).padStart(2, "0");
  const nome = conflito.cliente_nome?.trim() || "Cliente";
  return `Este horário se sobrepõe ao agendamento de ${nome} às ${hh}:${mm}. Escolha outro horário ou serviço.`;
};

/** Início e fim do dia civil no fuso da barbearia, em ISO UTC para consulta ao banco. */
export const rangeUtcDiaCivil = (localInstant: DateTime, timeZone: string) => {
  const local = localInstant.setZone(timeZone);
  const dayStart = local.startOf("day");
  const dayEnd = local.endOf("day");
  return {
    startUtc: dayStart.toUTC().toISO(),
    endUtc: dayEnd.toUTC().toISO(),
  };
};
