import { useState } from 'react';
import { AlertTriangle, CheckSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/components/ui/cn';
import { useActiveChat } from '@/hooks/useActiveChat';
import { useDebounce } from '@/hooks/useDebounce';
import { useTodos } from '@/hooks/useTodos';
import { TodoComposer } from './todos/TodoComposer';
import { TodoItem } from './todos/TodoItem';
import {
  filterTodos,
  sortTodos,
  type TodoSort,
  type TodoStatusFilter,
} from './todos/todo-utils';

const STATUS_FILTERS: ReadonlyArray<{ id: TodoStatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Done' },
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'By priority' },
  { value: 'newest', label: 'Newest' },
] as const satisfies ReadonlyArray<{ value: TodoSort; label: string }>;

/** Todos section: quick-add, filter by status, sort, search — all per chat. */
export function TodosSection(): JSX.Element {
  const chat = useActiveChat();
  const chatId = chat?.chatId ?? null;
  const [status, setStatus] = useState<TodoStatusFilter>('all');
  const [sort, setSort] = useState<TodoSort>('priority');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const result = useTodos(chatId);

  if (!chatId) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Open a chat to get started"
        description="Todos are tracked privately per conversation."
      />
    );
  }

  if (result === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading todos" />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load todos"
        description="Your browser storage may be unavailable. Your data is safe — try again."
      />
    );
  }

  const todos = result.value;
  const visible = sortTodos(filterTodos(todos, status, debouncedQuery), sort);

  return (
    <div className="flex flex-col gap-3 p-3">
      <TodoComposer chatId={chatId} />

      {todos.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet."
          description="Add your first task above — press Enter to save it."
        />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Filter todos"
              className="flex rounded-card bg-surface-muted p-0.5 dark:bg-surface-dark-muted"
            >
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  role="tab"
                  aria-selected={status === filter.id}
                  onClick={() => setStatus(filter.id)}
                  className={cn(
                    'rounded-[0.7rem] px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    status === filter.id
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-surface-dark dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <Select
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
              aria-label="Sort todos"
              className="ml-auto"
            />
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search tasks…"
            aria-label="Search todos"
          />

          {visible.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No tasks match your filters.</p>
          ) : (
            <ul className="space-y-2">
              {visible.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
