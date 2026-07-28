import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Section } from '@/types/enums';
import { NotesSection } from '../sections/NotesSection';
import { TodosSection } from '../sections/TodosSection';
import { RemindersSection } from '../sections/RemindersSection';
import { SettingsSection } from '../sections/SettingsSection';

const SECTION_COMPONENTS: Record<Section, () => JSX.Element> = {
  notes: NotesSection,
  todos: TodosSection,
  reminders: RemindersSection,
  settings: SettingsSection,
};

/**
 * Renders the active section, each isolated in its own error boundary so a
 * failure in one feature never takes down the rest of the sidebar.
 */
export function SectionOutlet({ section }: { section: Section }): JSX.Element {
  const SectionComponent = SECTION_COMPONENTS[section];
  return (
    <ErrorBoundary label={section}>
      <SectionComponent />
    </ErrorBoundary>
  );
}
