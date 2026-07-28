import { AlertTriangle, Bell } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useActiveChat } from '@/hooks/useActiveChat';
import { useReminders } from '@/hooks/useReminders';
import { ReminderComposer } from './reminders/ReminderComposer';
import { ReminderItem } from './reminders/ReminderItem';

/**
 * Reminders section: schedule per-chat reminders that fire Chrome notifications
 * (handled by the background worker) even when the sidebar is collapsed.
 */
export function RemindersSection(): JSX.Element {
  const chat = useActiveChat();
  const chatId = chat?.chatId ?? null;
  const result = useReminders(chatId);

  if (!chatId) {
    return (
      <EmptyState
        icon={Bell}
        title="Open a chat to get started"
        description="Reminders are scheduled privately per conversation."
      />
    );
  }

  if (result === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading reminders" />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load reminders"
        description="Your browser storage may be unavailable. Your data is safe — try again."
      />
    );
  }

  const reminders = result.value;

  return (
    <div className="flex flex-col gap-3 p-3">
      <ReminderComposer chatId={chatId} />

      {reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No reminders."
          description="Set a reminder above — we'll notify you even when the sidebar is closed."
        />
      ) : (
        <ul className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderItem key={reminder.id} reminder={reminder} />
          ))}
        </ul>
      )}
    </div>
  );
}
