import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { dayjs } from '@/utils/date';
import { cn } from './cn';
import { IconButton } from './IconButton';

export interface DateTimePickerProps {
  /** Selected value, epoch ms. */
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const TIME_SELECT_CLASS =
  'h-8 cursor-pointer rounded-lg bg-surface-muted px-1.5 text-xs text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:bg-surface-dark-muted dark:text-slate-200';

/**
 * A compact, self-contained calendar + time picker rendered as a popover — a
 * consistent replacement for the browser's native `datetime-local` control.
 * Closes on outside-click or Escape. Built on dayjs; no third-party dependency.
 */
export function DateTimePicker({ value, onChange, className }: DateTimePickerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => dayjs(value).startOf('month'));
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = dayjs(value);

  useEffect(() => {
    if (open) setViewMonth(dayjs(value).startOf('month'));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const gridStart = viewMonth.startOf('week');
  const days = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'));

  const pickDay = (day: ReturnType<typeof dayjs>): void => {
    onChange(
      day.hour(selected.hour()).minute(selected.minute()).second(0).millisecond(0).valueOf(),
    );
  };

  const setTime = (hour12: number, minute: number, isPm: boolean): void => {
    const hour24 = (hour12 % 12) + (isPm ? 12 : 0);
    onChange(selected.hour(hour24).minute(minute).second(0).millisecond(0).valueOf());
  };

  const hour12 = Number(selected.format('h'));
  const minute = selected.minute();
  const isPm = selected.format('A') === 'PM';
  const minuteValue = String(Math.floor(minute / 5) * 5).padStart(2, '0');

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-9 w-full items-center gap-2 rounded-card bg-surface-muted px-3 text-sm text-slate-700 transition-colors hover:bg-slate-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:bg-surface-dark dark:text-slate-200 dark:hover:bg-white/10"
      >
        <Calendar size={15} className="shrink-0 text-slate-400" aria-hidden />
        <span className="truncate">{selected.format('ddd, MMM D · h:mm A')}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose date and time"
          className="absolute left-0 top-full z-[2147483002] mt-1.5 w-[16.5rem] rounded-card border border-black/5 bg-surface-light p-3 shadow-soft dark:border-white/10 dark:bg-surface-dark"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <IconButton
              label="Previous month"
              onClick={() => setViewMonth((m) => m.subtract(1, 'month'))}
            >
              <ChevronLeft size={16} aria-hidden />
            </IconButton>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-100">
              {viewMonth.format('MMMM YYYY')}
            </span>
            <IconButton
              label="Next month"
              onClick={() => setViewMonth((m) => m.add(1, 'month'))}
            >
              <ChevronRight size={16} aria-hidden />
            </IconButton>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-400">
            {WEEKDAYS.map((day, index) => (
              <span key={index} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const inMonth = day.isSame(viewMonth, 'month');
              const isSelected = day.isSame(selected, 'day');
              const isToday = day.isSame(dayjs(), 'day');
              return (
                <button
                  key={day.valueOf()}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={cn(
                    'flex h-7 items-center justify-center rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    isSelected
                      ? 'bg-brand font-semibold text-white'
                      : inMonth
                        ? 'text-slate-700 hover:bg-brand/10 dark:text-slate-200'
                        : 'text-slate-300 dark:text-slate-600',
                    !isSelected && isToday && 'ring-1 ring-inset ring-brand/50',
                  )}
                >
                  {day.date()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-1.5 border-t border-black/5 pt-3 dark:border-white/10">
            <span className="text-[11px] font-medium text-slate-400">Time</span>
            <select
              aria-label="Hour"
              value={String(hour12)}
              onChange={(event) => setTime(Number(event.target.value), minute, isPm)}
              className={cn(TIME_SELECT_CLASS, 'ml-auto')}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">:</span>
            <select
              aria-label="Minute"
              value={minuteValue}
              onChange={(event) => setTime(hour12, Number(event.target.value), isPm)}
              className={TIME_SELECT_CLASS}
            >
              {MINUTES.map((min) => (
                <option key={min} value={min}>
                  {min}
                </option>
              ))}
            </select>
            <select
              aria-label="AM or PM"
              value={isPm ? 'PM' : 'AM'}
              onChange={(event) => setTime(hour12, minute, event.target.value === 'PM')}
              className={TIME_SELECT_CLASS}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}
