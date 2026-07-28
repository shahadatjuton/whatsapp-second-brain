import { CheckSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Todos section — placeholder shell. Full CRUD with priority, filtering and
 * search is implemented in Milestone 6.
 */
export function TodosSection(): JSX.Element {
  return (
    <EmptyState
      icon={CheckSquare}
      title="No tasks yet."
      description="Track action items for this conversation without leaving WhatsApp."
    />
  );
}
