import { Bell } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Reminders section — placeholder shell. Scheduling with Chrome notifications
 * is implemented in Milestone 7.
 */
export function RemindersSection(): JSX.Element {
  return (
    <EmptyState
      icon={Bell}
      title="No reminders."
      description="Set a reminder and we'll notify you — even when the sidebar is closed."
    />
  );
}
