import { dayjs } from '@/utils/date';

export interface ReminderPreset {
  id: string;
  label: string;
  /** Compute the fire time (epoch ms) relative to now. */
  getDatetime: () => number;
}

/** Default reminder time-of-day for date-only presets. */
const DEFAULT_HOUR = 9;

function atDefaultTime(base: ReturnType<typeof dayjs>): number {
  return base.hour(DEFAULT_HOUR).minute(0).second(0).millisecond(0).valueOf();
}

/** Quick presets (PRD: Tomorrow, Next Week). Custom date/time is a separate input. */
export const REMINDER_PRESETS: ReadonlyArray<ReminderPreset> = [
  {
    id: 'tomorrow',
    label: 'Tomorrow',
    getDatetime: () => atDefaultTime(dayjs().add(1, 'day')),
  },
  {
    id: 'next-week',
    label: 'Next week',
    getDatetime: () => atDefaultTime(dayjs().add(1, 'week')),
  },
];

/** A sensible default when the composer opens. */
export function defaultReminderDatetime(): number {
  return atDefaultTime(dayjs().add(1, 'day'));
}
