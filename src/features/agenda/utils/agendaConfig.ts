import { format } from 'date-fns';

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

type LegacyAgendaDayConfig = Partial<AgendaDayConfig> & {
  lunchStart?: string | null;
  lunchEnd?: string | null;
};

export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export const DEFAULT_WEEK_SCHEDULE: AgendaDayConfig[] = [
  { enabled: true, startTime: '08:00', endTime: '19:00', pauses: [{ startTime: '12:00', endTime: '13:00' }] },
  { enabled: true, startTime: '08:00', endTime: '19:00', pauses: [{ startTime: '12:00', endTime: '13:00' }] },
  { enabled: true, startTime: '08:00', endTime: '19:00', pauses: [{ startTime: '12:00', endTime: '13:00' }] },
  { enabled: true, startTime: '08:00', endTime: '19:00', pauses: [{ startTime: '12:00', endTime: '13:00' }] },
  { enabled: true, startTime: '08:00', endTime: '19:00', pauses: [{ startTime: '12:00', endTime: '13:00' }] },
  { enabled: true, startTime: '08:00', endTime: '19:00', pauses: [{ startTime: '12:00', endTime: '13:00' }] },
  { enabled: true, startTime: '08:00', endTime: '19:00', pauses: [{ startTime: '12:00', endTime: '13:00' }] },
];

export const DEFAULT_AGENDA_CONFIG: AgendaConfig = {
  slotDurationMinutes: 60,
  weekSchedule: DEFAULT_WEEK_SCHEDULE,
};

export const parseTimeToMinutes = (time: string | null | undefined) => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);

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

export const formatMinutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const sanitizePause = (pause?: Partial<AgendaPauseConfig> | { startTime?: string | null; endTime?: string | null } | null) => {
  const startTime = pause?.startTime ?? null;
  const endTime = pause?.endTime ?? null;

  if (parseTimeToMinutes(startTime) === null || parseTimeToMinutes(endTime) === null) {
    return null;
  }

  if (parseTimeToMinutes(startTime)! >= parseTimeToMinutes(endTime)!) {
    return null;
  }

  return {
    startTime,
    endTime,
  };
};

const getLegacyPauses = (day?: LegacyAgendaDayConfig | null) => {
  if (!day?.lunchStart || !day?.lunchEnd) {
    return [];
  }

  const pause = sanitizePause({
    startTime: day.lunchStart,
    endTime: day.lunchEnd,
  });

  return pause ? [pause] : [];
};

const sanitizeDayConfig = (
  day?: LegacyAgendaDayConfig | null,
  fallback: AgendaDayConfig = DEFAULT_WEEK_SCHEDULE[0]
): AgendaDayConfig => {
  const startTime = day?.startTime === undefined ? fallback.startTime : day.startTime;
  const endTime = day?.endTime === undefined ? fallback.endTime : day.endTime;
  const incomingPauses = Array.isArray(day?.pauses) ? day.pauses : getLegacyPauses(day);
  const pauses = incomingPauses
    .map((pause) => sanitizePause(pause))
    .filter((pause): pause is AgendaPauseConfig => Boolean(pause))
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
      {
        ...defaultDay,
        ...(incomingSchedule[index] || {}),
      },
      defaultDay
    )
  );

  return {
    slotDurationMinutes,
    weekSchedule,
  };
};

export const getAgendaDayConfig = (config: AgendaConfig, date: Date) =>
  config.weekSchedule[date.getDay()] || DEFAULT_WEEK_SCHEDULE[date.getDay()];

export const getTimeSlotsForDate = (config: AgendaConfig, date: Date) => {
  const dayConfig = getAgendaDayConfig(config, date);

  if (!dayConfig.enabled) {
    return [];
  }

  const startMinutes = parseTimeToMinutes(dayConfig.startTime);
  const endMinutes = parseTimeToMinutes(dayConfig.endTime);

  if (startMinutes === null || endMinutes === null || startMinutes > endMinutes) {
    return [];
  }

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

    if (!isPaused) {
      slots.push(formatMinutesToTime(minutes));
    }
  }

  return slots;
};

export const isDateTimeWithinAgenda = (config: AgendaConfig, dateValue: Date | string) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const dayConfig = getAgendaDayConfig(config, date);

  if (!dayConfig.enabled) {
    return false;
  }

  const minutes = date.getHours() * 60 + date.getMinutes();
  const slots = getTimeSlotsForDate(config, date);

  return slots.includes(format(date, 'HH:mm')) && minutes % config.slotDurationMinutes === 0;
};

export const getAgendaValidationMessage = (config: AgendaConfig, dateValue?: Date | string) => {
  const date = dateValue ? (dateValue instanceof Date ? dateValue : new Date(dateValue)) : null;

  if (date) {
    const dayConfig = getAgendaDayConfig(config, date);

    if (!dayConfig.enabled) {
      return `O barbeiro nao atende ${DAY_LABELS[date.getDay()].toLowerCase()}.`;
    }

    const pausesMessage = dayConfig.pauses.length
      ? ` Pausas: ${dayConfig.pauses.map((pause) => `${pause.startTime} as ${pause.endTime}`).join(', ')}.`
      : '';

    return `Escolha um horario valido de ${dayConfig.startTime} ate ${dayConfig.endTime} com intervalos de ${config.slotDurationMinutes} min.${pausesMessage}`;
  }

  return `Escolha um horario valido respeitando a grade configurada e intervalos de ${config.slotDurationMinutes} min.`;
};
