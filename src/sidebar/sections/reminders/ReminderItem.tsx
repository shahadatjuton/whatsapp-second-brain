import { useEffect, useState } from 'react';
import { Check, Clock, Trash2, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/components/ui/cn';
import { remindersService } from '@/services/reminders.service';
import type { Reminder } from '@/types/models';
import { formatDateTime, fromNow } from '@/utils/date';

interface ReminderItemProps {
  reminder: Reminder;
}

/** A single reminder row: completion toggle, due time, overdue state, delete. */
export function ReminderItem({ reminder }: ReminderItemProps): JSX.Element {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isOverdue = !reminder.completed && reminder.datetime <= Date.now();

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  return (
    <li className="flex items-start gap-2.5 rounded-card border border-black/5 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-surface-dark-muted">
      <div className="pt-0.5">
        <Checkbox
          checked={reminder.completed}
          onChange={() => void remindersService.complete(reminder.id)}
          label={reminder.completed ? 'Completed' : 'Mark as done'}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'break-words text-sm',
            reminder.completed
              ? 'text-slate-400 line-through'
              : 'text-slate-800 dark:text-slate-100',
          )}
        >
          {reminder.title}
        </p>
        <div
          className={cn(
            'mt-1 inline-flex items-center gap-1 text-[11px]',
            isOverdue ? 'text-amber-600' : 'text-slate-400',
          )}
          title={formatDateTime(reminder.datetime)}
        >
          <Clock size={12} aria-hidden />
          <span>
            {isOverdue ? 'Overdue · ' : ''}
            {fromNow(reminder.datetime)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {confirmingDelete ? (
          <>
            <IconButton
              label="Confirm delete"
              onClick={() => void remindersService.remove(reminder.id)}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
            >
              <Check size={15} aria-hidden />
            </IconButton>
            <IconButton label="Cancel delete" onClick={() => setConfirmingDelete(false)}>
              <X size={15} aria-hidden />
            </IconButton>
          </>
        ) : (
          <IconButton label="Delete reminder" onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={15} aria-hidden />
          </IconButton>
        )}
      </div>
    </li>
  );
}
