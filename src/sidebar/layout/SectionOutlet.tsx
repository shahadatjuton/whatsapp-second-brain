import { Suspense, lazy, type LazyExoticComponent } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Spinner } from '@/components/ui/Spinner';
import type { Section } from '@/types/enums';

/**
 * Sections are lazy-loaded so their heavier dependencies (React Hook Form + Zod
 * for todos, the markdown renderer for notes, modals for settings) are split
 * into on-demand chunks instead of bloating the initial content-script bundle.
 */
const SECTION_COMPONENTS: Record<Section, LazyExoticComponent<() => JSX.Element>> = {
  notes: lazy(() => import('../sections/NotesSection').then((m) => ({ default: m.NotesSection }))),
  todos: lazy(() => import('../sections/TodosSection').then((m) => ({ default: m.TodosSection }))),
  reminders: lazy(() =>
    import('../sections/RemindersSection').then((m) => ({ default: m.RemindersSection })),
  ),
  settings: lazy(() =>
    import('../sections/SettingsSection').then((m) => ({ default: m.SettingsSection })),
  ),
};

/**
 * Renders the active section, each isolated in its own error boundary so a
 * failure (or a failed chunk load) in one feature never takes down the sidebar.
 */
export function SectionOutlet({ section }: { section: Section }): JSX.Element {
  const SectionComponent = SECTION_COMPONENTS[section];
  return (
    <ErrorBoundary label={section}>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner label="Loading" />
          </div>
        }
      >
        <SectionComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
