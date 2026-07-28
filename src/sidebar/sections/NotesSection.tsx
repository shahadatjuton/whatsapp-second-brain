import { StickyNote } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Notes section — placeholder shell (empty state only). Full markdown editor
 * with autosave and search is implemented in Milestone 5.
 */
export function NotesSection(): JSX.Element {
  return (
    <EmptyState
      icon={StickyNote}
      title="Start writing your private notes."
      description="Notes you add here are attached to this chat and stay on your device."
    />
  );
}
