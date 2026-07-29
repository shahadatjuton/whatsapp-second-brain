import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Section } from '@/types/enums';
import { NotesSection } from '../sections/NotesSection';
import { RemindersSection } from '../sections/RemindersSection';
import { SettingsSection } from '../sections/SettingsSection';
import { TodosSection } from '../sections/TodosSection';

/**
 * Renders the active section, each isolated in its own error boundary so a
 * failure in one feature never takes down the rest of the sidebar.
 *
 * Sections are imported statically (not React.lazy): in a content script,
 * runtime dynamic-import chunks can 404 after a rebuild ("Failed to fetch
 * dynamically imported module"), so we keep everything in one self-contained
 * bundle. Off-screen list rows are virtualized via `content-visibility` instead.
 */
const SECTION_COMPONENTS: Record<Section, () => JSX.Element> = {
  notes: NotesSection,
  todos: TodosSection,
  reminders: RemindersSection,
  settings: SettingsSection,
};

export function SectionOutlet({ section }: { section: Section }): JSX.Element {
  const SectionComponent = SECTION_COMPONENTS[section];
  return (
    <ErrorBoundary label={section}>
      <SectionComponent />
    </ErrorBoundary>
  );
}
