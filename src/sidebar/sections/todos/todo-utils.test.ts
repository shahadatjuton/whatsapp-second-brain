import { describe, expect, it } from 'vitest';
import type { Todo } from '@/types/models';
import type { Priority } from '@/types/enums';
import { filterTodos, sortTodos } from './todo-utils';

function makeTodo(overrides: Partial<Todo> & { id: string }): Todo {
  return {
    chatId: 'A',
    title: 'task',
    description: '',
    priority: 'medium' as Priority,
    completed: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('filterTodos', () => {
  const todos = [
    makeTodo({ id: '1', title: 'Buy milk', completed: false }),
    makeTodo({ id: '2', title: 'Call bank', completed: true }),
    makeTodo({ id: '3', title: 'Milk delivery', description: 'dairy', completed: false }),
  ];

  it('filters by active status', () => {
    expect(filterTodos(todos, 'active', '').map((t) => t.id)).toEqual(['1', '3']);
  });

  it('filters by completed status', () => {
    expect(filterTodos(todos, 'completed', '').map((t) => t.id)).toEqual(['2']);
  });

  it('searches title and description case-insensitively', () => {
    expect(filterTodos(todos, 'all', 'milk').map((t) => t.id)).toEqual(['1', '3']);
    expect(filterTodos(todos, 'all', 'DAIRY').map((t) => t.id)).toEqual(['3']);
  });
});

describe('sortTodos', () => {
  it('puts incomplete before completed, then orders by priority', () => {
    const todos = [
      makeTodo({ id: 'done-high', priority: 'high', completed: true }),
      makeTodo({ id: 'low', priority: 'low' }),
      makeTodo({ id: 'high', priority: 'high' }),
      makeTodo({ id: 'medium', priority: 'medium' }),
    ];
    expect(sortTodos(todos, 'priority').map((t) => t.id)).toEqual([
      'high',
      'medium',
      'low',
      'done-high',
    ]);
  });

  it('orders by newest when requested', () => {
    const todos = [
      makeTodo({ id: 'old', createdAt: 100 }),
      makeTodo({ id: 'new', createdAt: 300 }),
      makeTodo({ id: 'mid', createdAt: 200 }),
    ];
    expect(sortTodos(todos, 'newest').map((t) => t.id)).toEqual(['new', 'mid', 'old']);
  });
});
