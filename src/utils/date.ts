import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/** Relative label, e.g. "3 minutes ago". */
export function fromNow(timestamp: number): string {
  return dayjs(timestamp).fromNow();
}

/** Absolute, human-readable date-time. */
export function formatDateTime(timestamp: number): string {
  return dayjs(timestamp).format('MMM D, YYYY · h:mm A');
}

/** Value suitable for a `datetime-local` input (`YYYY-MM-DDTHH:mm`). */
export function toDateTimeLocalValue(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DDTHH:mm');
}

export { dayjs };
