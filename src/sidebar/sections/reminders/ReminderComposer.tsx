import { useState, type KeyboardEvent } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { Input } from '@/components/ui/Input';
import { cn } from '@/components/ui/cn';
import { remindersService } from '@/services/reminders.service';
import { REMINDER_PRESETS, defaultReminderDatetime } from './reminder-options';

interface ReminderComposerProps {
  chatId: string;
}

/** Compose a reminder: title + a quick preset or a custom date/time. */
export function ReminderComposer({ chatId }: ReminderComposerProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState<number>(defaultReminderDatetime);

  const submit = async (): Promise<void> => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle('');
    setDatetime(defaultReminderDatetime());
    await remindersService.create(chatId, { title: trimmed, datetime });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }
  };

  const isPast = datetime <= Date.now();

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-black/5 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-surface-dark-muted">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Remind me to…"
        aria-label="Reminder title"
      />

      <div className="flex flex-wrap gap-1.5">
        {REMINDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setDatetime(preset.getDatetime())}
            className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-brand/10 hover:text-brand-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:bg-surface-dark dark:text-slate-300"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <DateTimePicker value={datetime} onChange={setDatetime} />

      <div className="flex items-center justify-between gap-2 border-t border-black/5 pt-2.5 dark:border-white/10">
        <span className={cn('text-[11px]', isPast ? 'text-amber-600' : 'text-slate-400')}>
          {isPast ? 'Fires immediately' : 'Scheduled'}
        </span>
        <Button size="sm" onClick={() => void submit()} disabled={!title.trim()}>
          <Bell size={15} aria-hidden />
          Set reminder
        </Button>
      </div>
    </div>
  );
}
