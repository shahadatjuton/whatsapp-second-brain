import { PRIORITY_WEIGHT } from '@/types/enums';
import type { Todo } from '@/types/models';

export type TodoStatusFilter = 'all' | 'active' | 'completed';
export type TodoSort = 'priority' | 'newest';

/** Filter by completion status and a free-text query over title + description. */
export function filterTodos(todos: Todo[], status: TodoStatusFilter, query: string): Todo[] {
  const needle = query.trim().toLowerCase();
  return todos.filter((todo) => {
    if (status === 'active' && todo.completed) return false;
    if (status === 'completed' && !todo.completed) return false;
    if (needle) {
      const haystack = `${todo.title} ${todo.description}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * Sort todos. Incomplete tasks always come first; within each group we order by
 * the chosen key. `Array.prototype.sort` is stable, so the two passes compose
 * correctly.
 */
export function sortTodos(todos: Todo[], sort: TodoSort): Todo[] {
  const sorted = [...todos];
  if (sort === 'priority') {
    sorted.sort(
      (a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || b.createdAt - a.createdAt,
    );
  } else {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  }
  sorted.sort((a, b) => Number(a.completed) - Number(b.completed));
  return sorted;
}
